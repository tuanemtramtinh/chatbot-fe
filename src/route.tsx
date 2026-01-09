import { createBrowserRouter } from "react-router";
import AppLayout from "./AppLayout";
import MessagesPage from "./pages/messages";
import HomePage from "./pages/home";

const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: "messages",
        children: [{ path: ":id", Component: MessagesPage }],
      },
    ],
  },
]);

export default router;
