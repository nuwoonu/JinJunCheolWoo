import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import BuildingList from "./components/BuildingList";
import FloorList from "./components/FloorList";
import RoomView from "./components/RoomView";
import Library from "./components/Library";
import BorrowedBooks from "./components/BorrowedBooks";
import OverdueBooks from "./components/OverdueBooks";
import ReadingStats from "./components/ReadingStats";
import BookDetail from "./components/BookDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Library />,
      },
      {
        path: "book/:bookId",
        element: <BookDetail />,
      },
      {
        path: "library/borrowed",
        element: <BorrowedBooks />,
      },
      {
        path: "library/overdue",
        element: <OverdueBooks />,
      },
      {
        path: "library/stats",
        element: <ReadingStats />,
      },
      {
        path: "dormitory",
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