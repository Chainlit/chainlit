import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

Sentry.init({
  dsn:process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],

  tracesSampleRate: 1.0,
  beforeSend(event) {
    const allowedHosts = ["avaia.io", "chat.avaia.io"];
    if (!allowedHosts.includes(window.location.hostname)) {
      return null; 
    }
    return event; 
  },
});
