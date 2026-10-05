const edge = "#d4c7cb";
const ink = "#1b1517";
const quiet = "#756a6e";
const wine = "#530e20";

function Box({
  cx,
  cy,
  w,
  h,
  accent,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  accent?: boolean;
}) {
  return (
    <rect
      x={cx - w / 2}
      y={cy - h / 2}
      width={w}
      height={h}
      rx={10}
      fill={accent ? "#fcf3f5" : "#ffffff"}
      stroke={accent ? wine : edge}
      strokeWidth={accent ? 1.75 : 1.25}
    />
  );
}

const teamX = [91, 259, 427, 595];
const teamW = 150;
const teamY = 314;
const teamH = 44;
const leafY = 406;
const leafH = 40;
const pdX = 343;
const pdY = 198;
const pdW = 200;
const pdH = 52;
const faX = 660;
const faW = 130;
const ceoX = 400;
const ceoY = 78;
const ceoW = 280;
const ceoH = 62;

const teams = [
  { label: "DESIGN TEAM", x: teamX[0] },
  { label: "VISUAL TEAM", x: teamX[1] },
  { label: "DRAFTING TEAM", x: teamX[2] },
  { label: "PROCUREMENT TEAM", x: teamX[3] },
];

const roles = [
  { label: "Designer", x: teamX[0] },
  { label: "Visualizer", x: teamX[1] },
  { label: "Draftsman", x: teamX[2] },
  { label: "Комплектатор", x: teamX[3] },
];

export function OrgChart() {
  return (
    <svg
      viewBox="0 0 760 456"
      role="img"
      aria-label="Организационная структура JANERKE ABAT DESIGN STUDIO"
      className="w-full"
      fontFamily="inherit"
    >
      <g fill="none" stroke={edge} strokeWidth={1.25}>
        <path d="M400 109V139M343 139H660M343 139V172M660 139V172" />
        <path d="M343 224V259M91 259H595M91 259V292M259 259V292M427 259V292M595 259V292" />
        {teamX.map((x) => (
          <line key={x} x1={x} x2={x} y1={teamY + teamH / 2} y2={leafY - leafH / 2} />
        ))}
      </g>

      <g>
        <Box cx={ceoX} cy={ceoY} w={ceoW} h={ceoH} accent />
        <text x={ceoX} y={ceoY - 3} textAnchor="middle" fontSize={16} fontWeight={600} fill={wine}>
          ZHANERKE ABAT
        </text>
        <text x={ceoX} y={ceoY + 18} textAnchor="middle" fontSize={12} fill={quiet}>
          ОСНОВАТЕЛЬ / CEO
        </text>
      </g>

      <g>
        <Box cx={pdX} cy={pdY} w={pdW} h={pdH} />
        <text x={pdX} y={pdY + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill={ink}>
          PROJECT DIRECTOR
        </text>
      </g>

      <g>
        <Box cx={faX} cy={pdY} w={faW} h={pdH} />
        <text x={faX} y={pdY - 3} textAnchor="middle" fontSize={13} fontWeight={600} fill={ink}>
          FINANCE /
        </text>
        <text x={faX} y={pdY + 13} textAnchor="middle" fontSize={13} fontWeight={600} fill={ink}>
          ADMIN
        </text>
      </g>

      {teams.map((t) => (
        <g key={t.label}>
          <Box cx={t.x} cy={teamY} w={teamW} h={teamH} />
          <text x={t.x} y={teamY + 4} textAnchor="middle" fontSize={12.5} fill={ink}>
            {t.label}
          </text>
        </g>
      ))}

      {roles.map((r) => (
        <g key={r.label}>
          <Box cx={r.x} cy={leafY} w={teamW} h={leafH} />
          <text x={r.x} y={leafY + 4} textAnchor="middle" fontSize={13} fill={ink}>
            {r.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
