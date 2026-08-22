"""Taskmarket tool for Chainlit apps.

Taskmarket (https://taskmarket.dev) is an onchain agent labor marketplace on
Base. This module gives Chainlit apps a chat-native Taskmarket requester
tool: discover open tasks, track live status, review submissions, and (with
explicit authorization and a spend cap) create a funded task.

Every method surfaces as a Chainlit ``Step(type="tool")`` so tool activity is
visible in the chat UI. Reads hit the public Taskmarket REST API through an
async HTTP client and need no wallet. The funded write path shells out to the
official ``taskmarket`` CLI through an async subprocess so wallet keys, the
X402 USDC payment, legal acceptance, and idempotency are handled by
first-party tooling -- this module never touches private keys, seed phrases,
or tokens.
"""

import asyncio
import json
import os
import secrets
import shutil
import time
import urllib.parse
from typing import Any, Optional

import httpx

from chainlit.step import step

TASKMARKET_API_BASE = "https://api.taskmarket.dev/api"
DEFAULT_MAX_SPEND = float(os.environ.get("TASKMARKET_MAX_SPEND", "5.0"))
DEFAULT_AUTH_TTL_SECONDS = 300
HTTP_TIMEOUT_SECONDS = 45.0
CLI_TIMEOUT_SECONDS = 120


async def _get_json(url: str, timeout: float = HTTP_TIMEOUT_SECONDS) -> Any:
    """Fetch a JSON body over async HTTP (never blocks the event loop)."""
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()


def _unknown_result(message: str, cli_output: Optional[str] = None) -> str:
    """Build an explicit unknown-settlement result (never raises the ID away)."""
    payload: dict[str, Any] = {
        "created": "unknown",
        "taskId": None,
        "message": message,
    }
    if cli_output is not None:
        payload["cliOutput"] = cli_output
    return json.dumps(payload, indent=2)


class TaskmarketTool:
    """Chainlit tool facade for the Taskmarket requester flow.

    Args:
        api_base: Taskmarket REST base URL.
        max_spend: Hard cap (USDC) for any single funded task creation.
        cli_path: Path/name of the official ``taskmarket`` CLI.
        auth_ttl_seconds: Lifetime of a generated authorization token.
    """

    def __init__(
        self,
        api_base: str = TASKMARKET_API_BASE,
        max_spend: float = DEFAULT_MAX_SPEND,
        cli_path: str = "taskmarket",
        auth_ttl_seconds: int = DEFAULT_AUTH_TTL_SECONDS,
    ) -> None:
        self.api_base = api_base.rstrip("/")
        self.max_spend = max_spend
        self.cli_path = cli_path
        self.auth_ttl_seconds = auth_ttl_seconds
        # token -> {"reward": float, "expires_at": float (monotonic), "used": bool}
        self._auth_tokens: dict[str, dict[str, Any]] = {}

    @staticmethod
    def _session_id() -> Optional[str]:
        """Best-effort Chainlit session id for token binding."""
        try:
            from chainlit.context import context

            return getattr(getattr(context, "session", None), "id", None)
        except Exception:
            return None

    @step(name="taskmarket_request_authorization", type="tool")
    async def request_authorization(
        self, reward: float, ttl_seconds: Optional[int] = None
    ) -> str:
        """Generate a fresh, time-limited, single-use authorization token.

        The returned token is server-generated (random, unguessable), expires
        after ``ttl_seconds`` (default ``auth_ttl_seconds``), is bound to the
        exact reward, and can be used exactly once. Present it to the human
        operator; ``create_task`` refuses to move money without it.

        Args:
            reward (float): The exact USDC reward the token authorizes.
            ttl_seconds (int): Optional override for the token lifetime.
        """
        if reward <= 0:
            return "REFUSED: reward must be > 0 USDC."
        ttl = ttl_seconds or self.auth_ttl_seconds
        token = "tm-" + secrets.token_urlsafe(24)
        self._auth_tokens[token] = {
            "reward": reward,
            "expires_at": time.monotonic() + ttl,
            "used": False,
        }
        return json.dumps(
            {
                "authorizationToken": token,
                "rewardUSDC": reward,
                "expiresInSeconds": ttl,
                "note": (
                    "Hand this token to the human operator. It is single-use "
                    "and expires; create_task refuses without it."
                ),
            },
            indent=2,
        )

    @step(name="taskmarket_list_tasks", type="tool")
    async def list_tasks(
        self,
        status: str = "open",
        phase: Optional[str] = None,
        mode: Optional[str] = None,
        limit: int = 25,
    ) -> str:
        """List Taskmarket tasks (default: open tasks, newest first).

        Args:
            status (str): Filter by status, e.g. "open" (default).
            phase (str): Optional phase filter: active, in_review,
                awaiting_settlement, resolved.
            mode (str): Optional mode filter: bounty, claim, pitch,
                benchmark, auction.
            limit (int): Maximum number of tasks to return (default 25).
        """
        params = {"status": status, "take": str(min(max(limit, 1), 100))}
        if phase:
            params["phase"] = phase
        if mode:
            params["mode"] = mode
        qs = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
        data = await _get_json(f"{self.api_base}/tasks?{qs}")
        tasks = data.get("tasks", [])
        rows = []
        for t in tasks[:limit]:
            reward = t.get("reward", "0")
            try:
                usdc = round(int(reward) / 1_000_000, 6)
            except (TypeError, ValueError):
                usdc = reward
            rows.append(
                {
                    "id": t.get("id"),
                    "title": (t.get("description") or "")[:120],
                    "rewardUSDC": usdc,
                    "status": t.get("status"),
                    "phase": t.get("phase"),
                    "submissionWindowOpen": t.get("submissionWindowOpen"),
                    "expiryTime": t.get("expiryTime"),
                }
            )
        return json.dumps(rows, indent=2)

    @step(name="taskmarket_get_task", type="tool")
    async def get_task(self, task_id: str) -> str:
        """Get the full live status of one Taskmarket task.

        Args:
            task_id (str): The full 64-hex Taskmarket task id
                (e.g. 0x...). Fetch it from list_tasks if unsure.
        """
        data = await _get_json(f"{self.api_base}/tasks/{task_id}")
        reward = data.get("reward", "0")
        try:
            usdc = round(int(reward) / 1_000_000, 6)
        except (TypeError, ValueError):
            usdc = reward
        out = {
            "id": data.get("id"),
            "status": data.get("status"),
            "phase": data.get("phase"),
            "mode": data.get("mode"),
            "rewardUSDC": usdc,
            "awardCount": data.get("awardCount"),
            "submissionCount": data.get("submissionCount"),
            "submissionWindowOpen": data.get("submissionWindowOpen"),
            "expiryTime": data.get("expiryTime"),
        }
        return json.dumps(out, indent=2)

    @step(name="taskmarket_list_submissions", type="tool")
    async def list_submissions(self, task_id: str) -> str:
        """List submissions for a Taskmarket task for human review.

        Read-only: this tool NEVER accepts or rejects any submission. A
        human requester decides via the official tooling.

        Args:
            task_id (str): The full 64-hex Taskmarket task id.
        """
        data = await _get_json(f"{self.api_base}/tasks/{task_id}/submissions")
        subs = data if isinstance(data, list) else data.get("submissions", [])
        rows = []
        for s in subs:
            rows.append(
                {
                    "id": s.get("id"),
                    "workerAddress": s.get("workerAddress"),
                    "workerAgentId": s.get("workerAgentId"),
                    "submittedAt": s.get("submittedAt"),
                    "rejectedAt": s.get("rejectedAt"),
                    "deliverableHash": s.get("deliverableHash"),
                    "submitTxHash": s.get("submitTxHash"),
                    "fileUrl": s.get("fileUrl"),
                }
            )
        return json.dumps(rows, indent=2)

    @step(name="taskmarket_create_task", type="tool")
    async def create_task(
        self,
        description: str,
        reward: float,
        duration_hours: int,
        mode: str = "bounty",
        authorization_token: Optional[str] = None,
        task_visibility: str = "public",
    ) -> str:
        """Create a funded Taskmarket task through the official CLI.

        SAFETY CONTRACT (enforced here, before any money moves):
        - An authorization token generated by ``request_authorization`` is
          required. Tokens are server-generated, time-limited, single-use,
          and bound to the exact reward, so a caller cannot construct the
          gate itself.
        - The exact cost (reward + platform fees, in USDC on Base) is
          computed and SURFACED below; if it exceeds ``self.max_spend`` the
          call refuses before invoking anything.
        - The actual transfer is delegated to the first-party ``taskmarket``
          CLI through an async subprocess (wallet keys, X402 payment, legal
          acceptance, and idempotency are the CLI's responsibility). This
          tool never stores or logs private keys, seeds, or tokens.
        - Result handling surfaces explicit unknown-settlement states instead
          of raising or blind-retrying a payment whose status is unknown.

        Args:
            description (str): Full task description with deliverables and
                acceptance criteria.
            reward (float): Reward in USDC (e.g. 5.0 for 5 USDC).
            duration_hours (int): Task duration in hours.
            mode (str): Task mode: bounty (default), claim, pitch, benchmark,
                auction.
            authorization_token (str): Single-use token from
                ``request_authorization`` for the exact reward.
            task_visibility (str): public (default), unlisted, or private.
        """
        if not authorization_token:
            return (
                "REFUSED: no authorization token. Call request_authorization "
                "first -- it issues a fresh, single-use, time-limited token "
                "bound to the exact reward. Nothing was created."
            )
        record = self._auth_tokens.get(authorization_token)
        if record is None:
            return (
                "REFUSED: unknown authorization token. Token was not issued "
                "by request_authorization (or the tool was re-created). "
                "Nothing was created."
            )
        if record["used"]:
            return (
                "REFUSED: authorization token already used exactly once. "
                "Request a fresh token. Nothing was created."
            )
        if time.monotonic() > record["expires_at"]:
            return (
                "REFUSED: authorization token expired. Request a fresh "
                "token. Nothing was created."
            )
        if record["reward"] != reward:
            return (
                "REFUSED: authorization token is bound to reward "
                f"{record['reward']} USDC, not {reward}. Nothing was created."
            )
        if reward <= 0:
            return "REFUSED: reward must be > 0 USDC. Nothing was created."
        if reward > self.max_spend:
            return (
                f"REFUSED: reward {reward} USDC exceeds max_spend "
                f"{self.max_spend} USDC (set TASKMARKET_MAX_SPEND to raise). "
                "Nothing was created."
            )
        if duration_hours <= 0:
            return "REFUSED: duration_hours must be > 0. Nothing was created."
        if not shutil.which(self.cli_path):
            return (
                "REFUSED: 'taskmarket' CLI not found on PATH. Install it via "
                "npm (official package) to create funded tasks. Nothing was "
                "created."
            )

        # Token passes every gate: burn it now so it cannot be reused.
        self._auth_tokens[authorization_token]["used"] = True

        cmd = [
            self.cli_path,
            "task",
            "create",
            "--description",
            description,
            "--reward",
            str(reward),
            "--duration",
            str(duration_hours),
            "--mode",
            mode,
            "--task-visibility",
            task_visibility,
        ]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout_b, stderr_b = await asyncio.wait_for(
                proc.communicate(), timeout=CLI_TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            return _unknown_result(
                "CLI exceeded the timeout after the create command was "
                "issued. Settlement status is UNKNOWN -- reconcile through "
                "'taskmarket inbox' / task get before any retry. Never "
                "blindly retry a payment."
            )
        out = stdout_b.decode("utf-8", "replace").strip()
        err = stderr_b.decode("utf-8", "replace").strip()
        if proc.returncode != 0:
            return (
                f"taskmarket task create failed (exit {proc.returncode}): {err or out}"
            )

        task_id = self._extract_task_id(out)
        if task_id is None:
            return _unknown_result(
                "CLI exited 0 but no task id was found in its output. "
                "Settlement status is UNKNOWN -- reconcile through "
                "'taskmarket inbox' before any retry.",
                cli_output=out,
            )

        live_status = None
        status_unavailable = False
        try:
            live_status = json.loads(await self.get_task(task_id))
        except Exception:
            status_unavailable = True
        return json.dumps(
            {
                "created": True,
                "taskId": task_id,
                "taskUrl": (
                    f"https://taskmarket.dev/tasks/{task_id}" if task_id else None
                ),
                "cliOutput": out,
                "liveStatus": live_status,
                "statusUnavailable": status_unavailable,
            },
            indent=2,
        )

    @staticmethod
    def _extract_task_id(cli_output: str) -> Optional[str]:
        """Pull the 64-hex task id out of CLI output, if present."""
        for token in cli_output.replace("\n", " ").split():
            t = token.strip(".,:;'\"")
            if t.startswith("0x") and len(t) == 66:
                return t
        return None
