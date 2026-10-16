import type { PropsWithChildren } from "react";

const UtilWrapper = ({ children }: PropsWithChildren) => {
  return (
    <div // fix for rendering bugs on mobile browsers
      style={{
        width: "100vw",
        height: "100vh",
        background: "#111",
        border: 0,
        position: "fixed",
        transform: "scale(1.005)",
        transformOrigin: "center center",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};
export default UtilWrapper;
