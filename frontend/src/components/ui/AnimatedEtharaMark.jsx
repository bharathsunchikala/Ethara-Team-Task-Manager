import Logo from "./Logo";

const AnimatedEtharaMark = () => (
  <div className="relative flex flex-1 items-center justify-center py-10">
    <div className="ethara-motion-stage">
      <span className="ethara-motion-ring ethara-motion-ring-one" />
      <span className="ethara-motion-ring ethara-motion-ring-two" />
      <span className="ethara-motion-scan" />

      <div className="ethara-motion-logo">
        <Logo imageClassName="h-16 max-w-[310px]" />
      </div>

      <div className="ethara-motion-shadow" />
    </div>
  </div>
);

export default AnimatedEtharaMark;
