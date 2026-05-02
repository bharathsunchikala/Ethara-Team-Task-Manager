import { cn } from "../../utils/cn";

const Logo = ({ className, imageClassName }) => (
  <span className={cn("inline-flex items-center", className)}>
    <img
      src="/ethara-logo.jpeg"
      alt="Ethara.AI"
      className={cn("h-11 w-auto max-w-full object-contain", imageClassName)}
    />
  </span>
);

export default Logo;
