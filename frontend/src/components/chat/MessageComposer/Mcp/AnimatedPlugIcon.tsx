import { Plug } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AnimatedPlugIconProps {
  duration?: number;
  strokeWidth?: number;
  className?: string;
}

const AnimatedPlugIcon: React.FC<AnimatedPlugIconProps> = ({
  duration = 1500,
  strokeWidth = 2,
  className = ''
}) => {
  const iconRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (iconRef.current) {
      // Get all SVG paths inside the icon
      const paths = iconRef.current.querySelectorAll('path');

      paths.forEach((path: SVGPathElement) => {
        // Get the total length of the path
        const length = path.getTotalLength();

        // Set up the starting position
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;

        // Create the animation
        path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
          duration: duration,
          easing: 'ease-in-out',
          iterations: Infinity,
          direction: 'alternate'
        });
      });
    }
  }, [duration]);

  return (
    <div ref={iconRef}>
      <Plug className={className} strokeWidth={strokeWidth} />
    </div>
  );
};

export default AnimatedPlugIcon;
