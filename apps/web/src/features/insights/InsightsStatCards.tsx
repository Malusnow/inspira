import type { InsightsStatCard } from "./insightsViewModel"

export interface InsightsStatCardsProps {
  cards: InsightsStatCard[]
}

export function InsightsStatCards({ cards }: InsightsStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl bg-surface p-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="text-[12.5px] text-ink-muted">{card.label}</div>
          <div className="mt-2 text-[28px] font-semibold leading-none text-ink-strong">
            {card.value}
          </div>
          <div className="mt-1.5 text-[12.5px] text-ink-muted">{card.hint}</div>
        </div>
      ))}
    </div>
  )
}
