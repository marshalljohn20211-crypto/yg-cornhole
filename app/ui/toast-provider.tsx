"use client";

import { ToastContainer } from "react-toastify";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3500}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="dark"
      aria-label="Cart notifications"
    />
  );
}
