"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

type Plane = { current: SVGGElement | null };

export default function EditorialWorkspaceGraphic() {
  const instanceId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const gridPlaneRef = useRef<SVGGElement>(null);
  const topologyPlaneRef = useRef<SVGGElement>(null);
  const gitPlaneRef = useRef<SVGGElement>(null);
  const foregroundPlaneRef = useRef<SVGGElement>(null);
  const pulseTimer = useRef<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState("");
  const [buildPulse, setBuildPulse] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let frame = 0;
    const planes: [Plane, number, number][] = [
      [gridPlaneRef, -4, -3],
      [topologyPlaneRef, 4.5, 3.5],
      [gitPlaneRef, 8, 6.5],
      [foregroundPlaneRef, 13, 10],
    ];

    function updateTarget(clientX: number, clientY: number) {
      const rect = container!.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
      targetY = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));
    }

    const onPointerMove = (event: PointerEvent) => updateTarget(event.clientX, event.clientY);
    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    function animate() {
      velocityX = (velocityX + (targetX - currentX) * 0.08) * 0.8;
      velocityY = (velocityY + (targetY - currentY) * 0.08) * 0.8;
      currentX += velocityX;
      currentY += velocityY;
      planes.forEach(([plane, x, y]) => {
        if (plane.current) {
          plane.current.style.transform = `translate3d(${(currentX * x).toFixed(2)}px, ${(currentY * y).toFixed(2)}px, 0)`;
        }
      });
      frame = window.requestAnimationFrame(animate);
    }

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);
    frame = window.requestAnimationFrame(animate);
    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => () => {
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
  }, []);

  function triggerBuildPulse() {
    setBuildPulse(true);
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setBuildPulse(false), 1600);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerBuildPulse();
    }
  }

  return (
    <div
      ref={containerRef}
      className="workspace-graphic"
      role="button"
      tabIndex={0}
      aria-label="Interactive engineering workspace illustration. Activate to accelerate the build animation."
      onClick={triggerBuildPulse}
      onKeyDown={handleKeyDown}
    >
      <svg
        viewBox="0 0 720 580"
        role="img"
        aria-label="Code editor, terminal, interface, API gateway, database, and git workflow."
        style={{ "--workspace-bus-duration": buildPulse ? "0.6s" : "1.8s" } as React.CSSProperties}
      >
        <defs>
          <pattern id={`${instanceId}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#252525" strokeOpacity=".065" />
          </pattern>
          <pattern id={`${instanceId}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#252525" strokeOpacity=".16" />
          </pattern>
          <clipPath id={`${instanceId}-ide-clip`}><rect x="86" y="76" width="248" height="174" /></clipPath>
          <clipPath id={`${instanceId}-shell-clip`}><rect x="68" y="344" width="268" height="162" /></clipPath>
          <clipPath id={`${instanceId}-spark-clip`}><rect x="448" y="138" width="174" height="32" /></clipPath>
        </defs>

        <g ref={gridPlaneRef}>
          <rect x="16" y="16" width="688" height="548" fill={`url(#${instanceId}-grid)`} />
          <rect x="384" y="46" width="284" height="488" fill="#ECE7DA" fillOpacity=".45" stroke="#252525" strokeOpacity=".18" />
          <rect x="44" y="296" width="136" height="236" fill={`url(#${instanceId}-hatch)`} stroke="#252525" strokeOpacity=".2" />
          <g stroke="#252525" strokeWidth="1" opacity=".32">
            <path d="M28 42H692M28 538H692M42 28V552M678 28V552" strokeDasharray="3 8" />
            <path d="M36 42h12m-6-6v12M672 42h12m-6-6v12M36 538h12m-6-6v12M672 538h12m-6-6v12" />
          </g>
        </g>

        <g ref={topologyPlaneRef} fill="none" stroke="#252525" strokeWidth="1.5">
          <path d="M16 144H54M342 152h56v104h46M534 196v28h-60v16M504 256h64v30M346 410h52V256M474 272v102h42" />
          <g className="workspace-bus" stroke="#E87524" strokeWidth="2">
            <path d="M16 144H54" />
            <path d="M342 152h56v104h46" style={{ animationDelay: "-.4s" }} />
            <path d="M534 196v28h-60v16" style={{ animationDelay: "-.9s" }} />
            <path d="M504 256h64v30" style={{ animationDelay: "-1.3s" }} />
            <path d="M346 410h52V256" style={{ animationDelay: "-.7s" }} />
            <path d="M474 272v102h42" style={{ animationDelay: "-1.1s" }} />
          </g>
          <circle cx="398" cy="256" r="5" fill="#F5F2EA" />
          <circle cx="398" cy="256" r="2" fill="#E87524" stroke="none" />
          <circle cx="398" cy="410" r="4.5" fill="#F5F2EA" />
          <g transform="translate(444 236)" onMouseEnter={() => setHoveredNode("api")} onMouseLeave={() => setHoveredNode("")}>
            <rect x="3" y="3" width="60" height="40" fill="#252525" />
            <rect width="60" height="40" fill="#F5F2EA" stroke={hoveredNode === "api" ? "#E87524" : "#252525"} />
            <path d="M0 12h60" />
            <rect x="7" y="4.5" width="12" height="3.5" fill="#E87524" stroke="none" />
            <rect x="46" y="4.5" width="7" height="3.5" fill="#252525" stroke="none" />
            <rect x="10" y="20" width="16" height="4" fill="#252525" stroke="none" />
            <rect x="32" y="20" width="18" height="4" fill="#252525" opacity=".4" stroke="none" />
            <rect x="10" y="28" width="26" height="4" fill="#E87524" stroke="none" />
          </g>
          <g transform="translate(534 286)" onMouseEnter={() => setHoveredNode("db")} onMouseLeave={() => setHoveredNode("")}>
            <path d="M0 10v48a34 10 0 0 0 68 0V10" fill="#F5F2EA" stroke={hoveredNode === "db" ? "#E87524" : "#252525"} />
            <path d="M0 26a34 10 0 0 0 68 0M0 42a34 10 0 0 0 68 0" />
            <ellipse cx="34" cy="10" rx="34" ry="10" fill="#ECE7DA" stroke={hoveredNode === "db" ? "#E87524" : "#252525"} />
            {[20, 36, 52].map((y) => <circle key={y} cx="54" cy={y} r="2.8" stroke="#252525" className="workspace-db-pulse" style={{ animationDelay: `${(y - 20) / -16 * 1.2}s` }} />)}
          </g>
        </g>

        <g ref={gitPlaneRef} onMouseEnter={() => setHoveredNode("git")} onMouseLeave={() => setHoveredNode("")}>
          <g transform="translate(492 360)">
            <rect x="3" y="3" width="164" height="154" fill="#252525" />
            <rect width="164" height="154" fill="#F5F2EA" stroke={hoveredNode === "git" ? "#E87524" : "#252525"} strokeWidth="1.5" />
            <path d="M0 22h164M48 36v102M48 116l48-18V64L48 46" fill="none" stroke="#252525" strokeWidth="1.5" />
            <path d="M48 116l48-18V64L48 46" fill="none" stroke="#E87524" strokeWidth="2" className="workspace-bus" />
            <path d="M48 84h76V58" fill="none" stroke="#252525" strokeDasharray="3 3" />
            <rect x="10" y="8" width="8" height="6" fill="#E87524" />
            <rect x="24" y="8" width="38" height="6" fill="#252525" />
            <rect x="128" y="8" width="24" height="6" fill="#252525" opacity=".28" />
            {[132, 116, 84].map((y) => <circle key={y} cx="48" cy={y} r="5" fill="#F5F2EA" stroke="#252525" strokeWidth="1.5" />)}
            {[98, 64].map((y, index) => <circle key={y} cx="96" cy={y} r="5.5" stroke="#252525" className="workspace-commit-pulse" style={{ animationDelay: `${index * -1.4}s` }} />)}
            <rect x="119" y="50" width="10" height="10" fill="#E87524" stroke="#252525" />
            <circle cx="48" cy="46" r="6.5" stroke="#252525" strokeWidth="1.75" className="workspace-commit-pulse" style={{ animationDelay: "-2.8s" }} />
            <rect x="110" y="96" width="28" height="4" fill="#252525" opacity=".35" />
            <rect x="110" y="62" width="22" height="4" fill="#252525" opacity=".35" />
            <rect x="62" y="44" width="34" height="4" fill="#E87524" />
          </g>
        </g>

        <g ref={foregroundPlaneRef}>
          <g className="workspace-ide" onMouseEnter={() => setHoveredNode("ide")} onMouseLeave={() => setHoveredNode("")}>
            <rect x="57" y="57" width="284" height="202" fill="#252525" />
            <rect x="54" y="54" width="284" height="202" fill="#F5F2EA" stroke={hoveredNode === "ide" ? "#E87524" : "#252525"} strokeWidth="1.5" />
            <path d="M54 76h284M86 76v180" stroke="#252525" />
            <circle cx="67" cy="65" r="3.5" fill="#E87524" stroke="#252525" />
            <circle cx="79" cy="65" r="3.5" fill="#F5F2EA" stroke="#252525" />
            <circle cx="91" cy="65" r="3.5" fill="#F5F2EA" stroke="#252525" />
            <rect x="110" y="54" width="64" height="22" fill="#ECE7DA" stroke="#252525" />
            <rect x="120" y="63" width="44" height="4" fill="#252525" />
            <g clipPath={`url(#${instanceId}-ide-clip)`}>
              <rect x="54" y="88" width="284" height="14" fill="#E87524" fillOpacity=".16" className="workspace-diff-step" />
              <rect x="54" y="88" width="3.5" height="14" fill="#E87524" className="workspace-diff-step" />
              {Array.from({ length: 10 }, (_, row) => <rect key={row} x="66" y={93 + row * 15} width="11" height="3.5" fill={row === 1 || row === 5 ? "#E87524" : "#252525"} opacity={row === 1 || row === 5 ? 1 : 0.35} />)}
              <g className="workspace-token-a">
                <rect x="98" y="92" width="42" height="5" fill="#E87524" /><rect x="146" y="92" width="96" height="5" fill="#252525" /><rect x="248" y="92" width="38" height="5" fill="#252525" opacity=".35" />
              </g>
              <g className="workspace-token-b">
                <rect x="98" y="107" width="56" height="5" fill="#252525" /><rect x="160" y="107" width="84" height="5" fill="#E87524" />
              </g>
              <g className="workspace-token-a" style={{ animationDelay: "-1.2s" }}>
                <rect x="114" y="122" width="74" height="5" fill="#252525" /><rect x="194" y="122" width="92" height="5" fill="#252525" opacity=".45" />
              </g>
              <g className="workspace-token-b" style={{ animationDelay: "-2.1s" }}>
                <rect x="130" y="137" width="48" height="5" fill="#E87524" /><rect x="184" y="137" width="108" height="5" fill="#252525" opacity=".7" />
              </g>
              <g className="workspace-token-a" style={{ animationDelay: "-.7s" }}>
                <rect x="130" y="152" width="88" height="5" fill="#252525" /><rect x="224" y="152" width="54" height="5" fill="#252525" opacity=".35" />
              </g>
              <rect x="114" y="167" width="24" height="5" fill="#252525" opacity=".65" />
              <g className="workspace-token-b" style={{ animationDelay: "-1.6s" }}>
                <rect x="114" y="182" width="64" height="5" fill="#252525" /><rect x="184" y="182" width="76" height="5" fill="#E87524" />
              </g>
              <g className="workspace-token-a" style={{ animationDelay: "-2.8s" }}><rect x="130" y="197" width="126" height="5" fill="#252525" opacity=".5" /></g>
              <rect x="114" y="212" width="44" height="5" fill="#E87524" /><rect x="164" y="212" width="68" height="5" fill="#252525" />
              <rect x="238" y="209" width="8" height="11" fill="#E87524" className="workspace-blink" />
              <rect x="98" y="227" width="18" height="5" fill="#252525" />
            </g>
          </g>

          <g className="workspace-shell" onMouseEnter={() => setHoveredNode("shell")} onMouseLeave={() => setHoveredNode("")}>
            <rect x="61" y="317" width="284" height="196" fill="#252525" />
            <rect x="58" y="314" width="284" height="196" fill="#252525" stroke={hoveredNode === "shell" ? "#E87524" : "#252525"} strokeWidth="1.5" />
            <path d="M58 336h284" stroke="#F5F2EA" strokeOpacity=".25" />
            <rect x="70" y="322" width="7" height="7" fill="#E87524" /><rect x="82" y="322" width="7" height="7" fill="#F5F2EA" opacity=".45" /><rect x="94" y="322" width="7" height="7" fill="#F5F2EA" opacity=".45" />
            <g clipPath={`url(#${instanceId}-shell-clip)`}>
              <path d="m74 354 7 4-7 4" fill="none" stroke="#E87524" strokeWidth="1.75" />
              <rect x="90" y="355" width="96" height="5" fill="#F5F2EA" /><rect x="194" y="355" width="54" height="5" fill="#F5F2EA" opacity=".45" />
              <g className="workspace-token-a"><rect x="74" y="374" width="156" height="4" fill="#F5F2EA" opacity=".38" /><rect x="74" y="386" width="124" height="4" fill="#F5F2EA" opacity=".38" /><rect x="74" y="398" width="182" height="4" fill="#E87524" /></g>
              <rect x="74" y="416" width="244" height="8" fill="none" stroke="#F5F2EA" strokeOpacity=".35" />
              <rect x="76" y="418" width="240" height="4" fill="#E87524" className="workspace-build-fill" />
              <path d="m74 442 7 4-7 4m0 20 7 4-7 4" fill="none" stroke="#E87524" strokeWidth="1.75" />
              <rect x="90" y="443" width="78" height="5" fill="#F5F2EA" /><rect x="176" y="443" width="92" height="5" fill="#F5F2EA" opacity=".5" />
              <rect x="90" y="471" width="64" height="5" fill="#F5F2EA" opacity=".85" /><rect x="162" y="467" width="9" height="13" fill="#E87524" className="workspace-blink" />
            </g>
          </g>

          <g className="workspace-ui" onMouseEnter={() => setHoveredNode("ui")} onMouseLeave={() => setHoveredNode("")}>
            <rect x="437" y="57" width="198" height="142" fill="#252525" />
            <rect x="434" y="54" width="198" height="142" fill="#F5F2EA" stroke={hoveredNode === "ui" ? "#E87524" : "#252525"} strokeWidth="1.5" />
            <path d="M434 74h198" stroke="#252525" strokeWidth="1.5" />
            <rect x="444" y="61" width="16" height="6" fill="#E87524" /><rect x="572" y="62" width="18" height="4" fill="#252525" /><rect x="596" y="62" width="24" height="4" fill="#252525" opacity=".4" />
            <rect x="446" y="84" width="102" height="42" fill="#ECE7DA" stroke="#252525" />
            <rect x="454" y="92" width="68" height="5" fill="#252525" /><rect x="454" y="102" width="84" height="4" fill="#252525" opacity=".4" /><rect x="454" y="112" width="32" height="7" fill="#E87524" />
            <rect x="556" y="84" width="64" height="42" fill="#F5F2EA" stroke="#252525" /><rect x="572" y="93" width="32" height="14" rx="7" fill="#252525" />
            <circle cx="582" cy="100" r="4.5" fill="#E87524" className="workspace-knob" />
            <rect x="568" y="114" width="40" height="4" fill="#252525" opacity=".45" />
            <rect x="446" y="136" width="174" height="46" fill="#ECE7DA" stroke="#252525" />
            <g clipPath={`url(#${instanceId}-spark-clip)`}>
              <polyline fill="none" stroke="#E87524" strokeWidth="1.75" className="workspace-spark" points="446,166 458,162 470,164 482,148 494,158 506,144 518,160 530,152 542,164 554,146 566,158 578,144 590,160 602,152 614,164 626,148 638,158 650,144 662,160 674,152" />
            </g>
            <rect x="454" y="173" width="48" height="3.5" fill="#252525" /><rect x="596" y="173" width="16" height="3.5" fill="#E87524" />
          </g>
        </g>
      </svg>
    </div>
  );
}
