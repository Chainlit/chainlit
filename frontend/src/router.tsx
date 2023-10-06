import { Navigate, createBrowserRouter } from 'react-router-dom';

import AuthCallback from 'pages/AuthCallback';
import Conversation from 'pages/Conversation';
import Design from 'pages/Design';
import Element from 'pages/Element';
import Env from 'pages/Env';
import Home from 'pages/Home';
import Login from 'pages/Login';
import Readme from 'pages/Readme';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/readme',
    element: <Readme />
  },
  {
    path: '/env',
    element: <Env />
  },
  {
    path: '/conversation/:id?',
    element: <Conversation />
  },
  {
    path: '/element/:id',
    element: <Element />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/design',
    element: <Design />
  },
  {
    path: '/login/callback',
    element: <AuthCallback />
  },
  {
    path: '*',
    element: <Navigate replace to="/" />
  }
]);
