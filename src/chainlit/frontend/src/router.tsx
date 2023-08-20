import { Navigate, createBrowserRouter } from 'react-router-dom';

import AuthCallback from 'pages/AuthCallback';
import Conversation from 'pages/Conversation';
import Dataset from 'pages/Dataset';
import Design from 'pages/Design';
import Element from 'pages/Element';
import Env from 'pages/Env';
import Home from 'pages/Home';
import Login from 'pages/Login';
import Page from 'pages/Page';
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
    path: '/conversations/:id',
    element: (
      <Page>
        <Conversation />
      </Page>
    )
  },
  {
    path: '/dataset',
    element: <Dataset />
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
    path: '/api/auth/callback',
    element: <AuthCallback />
  },
  {
    path: '*',
    element: <Navigate replace to="/" />
  }
]);
