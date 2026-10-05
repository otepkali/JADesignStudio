import { OrgChart } from "@/components/team/OrgChart";

const CEO_DUTIES = [
  "развитие бренда JANERKE ABAT",
  "позиционирование студии",
  "формирование продуктовой линейки",
  "развитие премиального сегмента",
  "привлечение ключевых клиентов",
  "переговоры по крупным проектам",
  "утверждение коммерческих предложений",
  "формирование ценовой политики",
  "развитие партнёрств и поставщиков",
  "контроль финансовых показателей",
  "найм ключевых сотрудников",
  "развитие личного бренда",
  "контроль качества проектов",
  "развитие новых направлений",
];

export default function StructurePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Оргструктура</h1>
        <p className="text-sm text-neutral-500">
          Иерархия студии и роль основателя. Регламент должностей и приёмки работы — JA HR 01 / JA QC 01.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <OrgChart />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-1 text-xs font-medium tracking-wide text-brand-700">
          ZHANERKE ABAT
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Founder / CEO</h2>

        <h3 className="mt-5 text-sm font-semibold text-neutral-700">Главная функция</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Стратегия, бренд, продажи, ключевые клиенты и финальный контроль качества.
        </p>

        <h3 className="mt-5 text-sm font-semibold text-neutral-700">Обязанности</h3>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-neutral-600 sm:grid-cols-2">
          {CEO_DUTIES.map((duty) => (
            <li key={duty} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-700" />
              <span>{duty}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
