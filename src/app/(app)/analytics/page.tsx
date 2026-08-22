import { getExpenseCategories, getFilteredExpenses, getProjectsForFilter } from "@/lib/data";
import { groupExpensesByCategory, groupExpensesBySubcategory } from "@/lib/analytics";
import { CategoryPieChart } from "@/components/project/CategoryPieChart";
import { formatTenge } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; categoryId?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const [expenses, projects, categories] = await Promise.all([
    getFilteredExpenses(params),
    getProjectsForFilter(),
    getExpenseCategories(),
  ]);

  const selectedCategory = params.categoryId
    ? categories.find((c) => c.id === params.categoryId) ?? null
    : null;

  const breakdownData = selectedCategory
    ? groupExpensesBySubcategory(expenses)
    : groupExpensesByCategory(expenses);
  const total = breakdownData.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Общая аналитика</h1>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">Проект</label>
          <select
            name="projectId"
            defaultValue={params.projectId ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Все проекты</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">Категория</label>
          <select
            name="categoryId"
            defaultValue={params.categoryId ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">С даты</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">По дату</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
        >
          Применить
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h2 className="mb-1 text-base font-semibold text-neutral-900">
            {selectedCategory ? `Подкатегории: ${selectedCategory.name}` : "Распределение расходов"}
          </h2>
          <CategoryPieChart data={breakdownData} />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h2 className="mb-3 text-base font-semibold text-neutral-900">
            {selectedCategory ? "Топ подкатегорий" : "Топ категорий"}
          </h2>
          {breakdownData.length === 0 ? (
            <p className="text-sm text-neutral-400">Нет данных за выбранный период</p>
          ) : (
            <ul className="space-y-2">
              {breakdownData
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700">{c.name}</span>
                    <span className="font-medium text-neutral-900">
                      {formatTenge(c.value)}{" "}
                      <span className="text-neutral-400">
                        ({total > 0 ? Math.round((c.value / total) * 100) : 0}%)
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <div className="mt-4 border-t border-neutral-100 pt-3 text-sm">
            <span className="text-neutral-500">Итого за период: </span>
            <span className="font-semibold text-neutral-900">{formatTenge(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
