'use client';

export default function PencilAnimation() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Paper background */}
        <rect
          x="30"
          y="40"
          width="140"
          height="120"
          fill="white"
          stroke="#0a1628"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Animated writing lines */}
        <g className="writing-lines">
          <line
            x1="45"
            y1="60"
            x2="45"
            y2="60"
            stroke="#0a1628"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <animate
              attributeName="x2"
              from="45"
              to="155"
              dur="2s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="45"
            y1="80"
            x2="45"
            y2="80"
            stroke="#0a1628"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <animate
              attributeName="x2"
              from="45"
              to="130"
              dur="2s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="45"
            y1="100"
            x2="45"
            y2="100"
            stroke="#0a1628"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <animate
              attributeName="x2"
              from="45"
              to="145"
              dur="2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="45"
            y1="120"
            x2="45"
            y2="120"
            stroke="#0a1628"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <animate
              attributeName="x2"
              from="45"
              to="110"
              dur="2s"
              begin="1.5s"
              repeatCount="indefinite"
            />
          </line>
        </g>

        {/* Pencil body - gold/champagne color */}
        <g className="pencil">
          <rect
            x="160"
            y="30"
            width="8"
            height="60"
            fill="#c9a962"
            stroke="#b89850"
            strokeWidth="1"
            transform="rotate(45 164 60)"
          />
          {/* Pencil tip */}
          <polygon
            points="173,23 164,32 169,27"
            fill="#8b7355"
            stroke="#6b5335"
            strokeWidth="0.5"
          />
          {/* Eraser */}
          <rect
            x="160"
            y="92"
            width="8"
            height="8"
            fill="#ff9999"
            stroke="#dd7777"
            strokeWidth="1"
            transform="rotate(45 164 96)"
          />

          {/* Animated movement */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -110,-20; -110,-60; -110,-100; 0,0"
            dur="8s"
            repeatCount="indefinite"
          />
        </g>
      </svg>
    </div>
  );
}
