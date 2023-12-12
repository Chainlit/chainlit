import { Navigate, createBrowserRouter } from 'react-router-dom';

import AuthCallback from 'pages/AuthCallback';
import Design from 'pages/Design';
import Element from 'pages/Element';
import Env from 'pages/Env';
import Home from 'pages/Home';
import Login from 'pages/Login';
import Readme from 'pages/Readme';
import Thread from 'pages/Thread';

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
    path: '/thread/:id?',
    element: <Thread />
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
