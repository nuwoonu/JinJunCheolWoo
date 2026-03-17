import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import BuildingList from "./components/BuildingList";
import FloorList from "./components/FloorList";
import RoomView from "./components/RoomView";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <BuildingList />,
      },
      {
        path: "building/:buildingId",
        element: <FloorList />,
      },
      {
        path: "building/:buildingId/room/:roomNumber",
        element: <RoomView />,
      },
    ],
  },
]);