/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
const Conversation = lazy(() => import('./pages/Conversation'));
const CreateRequest = lazy(() => import('./pages/CreateRequest'));
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'));
const Discover = lazy(() => import('./pages/Discover'));
const EditClientProfile = lazy(() => import('./pages/EditClientProfile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Favourites = lazy(() => import('./pages/Favourites'));
const Home = lazy(() => import('./pages/Home'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Messages = lazy(() => import('./pages/Messages'));
const MyRequests = lazy(() => import('./pages/MyRequests'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Settings = lazy(() => import('./pages/Settings'));
const Terms = lazy(() => import('./pages/Terms'));
const Updates = lazy(() => import('./pages/Updates'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "CommunityGuidelines": CommunityGuidelines,
    "Conversation": Conversation,
    "CreateRequest": CreateRequest,
    "CreatorProfile": CreatorProfile,
    "Discover": Discover,
    "EditClientProfile": EditClientProfile,
    "EditProfile": EditProfile,
    "Favourites": Favourites,
    "Home": Home,
    "Inbox": Inbox,
    "Messages": Messages,
    "MyRequests": MyRequests,
    "Notifications": Notifications,
    "Privacy": Privacy,
    "Settings": Settings,
    "Terms": Terms,
    "Updates": Updates,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};