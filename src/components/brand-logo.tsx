import Image from "next/image";

export function BrandLogo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/main.png"
      alt="DM Stack Labs Logo"
      width={size}
      height={size}
      className={`h-auto w-auto object-contain ${className}`}
      priority={size >= 64}
    />
  );
}
