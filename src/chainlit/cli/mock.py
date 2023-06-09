def mock_openai():
    import os
    from aioresponses import aioresponses
    import responses

    # Mock the openai api key
    os.environ["OPENAI_API_KEY"] = "sk-FAKE-OPENAI-API-KEY"

    mocked_json_reply = {
        "id": "cmpl-uqkvlQyYK7bGYrRHQ0eXlWi7",
        "object": "text_completion",
        "created": 1589478378,
        "model": "text-davinci-003",
        "choices": [
            {
                "text": "\n\n```text\n3*3\n```",
                "index": 0,
                "logprobs": None,
                "finish_reason": "length",
            }
        ],
        "usage": {
            "prompt_tokens": 5,
            "completion_tokens": 7,
            "total_tokens": 12,
        },
    }

    # Mock the sync openai api

    responses.start()

    responses.add(
        responses.POST,
        "https://api.openai.com/v1/completions",
        json=mocked_json_reply,
    )

    # Mock the async openai api
    aioresponses_obj = aioresponses()

    aioresponses_obj.start()

    aioresponses_obj.add(
        url="https://api.openai.com/v1/completions",
        method="POST",
        payload=mocked_json_reply,
    )
