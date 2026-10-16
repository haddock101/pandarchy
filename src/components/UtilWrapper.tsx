/* @ts-expect-error: Unknown */
const UtilWrapper = (props) => {
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
      {props.children}
    </div>
  );
};
export default UtilWrapper;
