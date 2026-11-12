<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import type { WinRow } from '~/types/casino'

defineProps<{
  rows: WinRow[]
}>()
</script>

<template>
  <section class="wins-section content-section" aria-labelledby="wins-title">
    <div class="section-heading">
      <div>
        <span class="heading-icon"><AppIcon name="trophy" :size="16" /></span>
        <h2 id="wins-title">Recent Wins</h2>
        <span class="demo-label text-[#77877f] light:text-[#5d7066]" title="Illustrative data only"><Info :size="12" /> Demo data</span>
      </div>
    </div>

    <div class="table-shell bg-[#111d17]/45 light:bg-white light:border-[#d8e2dc] light:shadow-sm" tabindex="0" aria-label="Recent wins demo table, horizontally scrollable">
      <table>
        <thead>
          <tr>
            <th scope="col" class="text-[#718079] light:text-[#5d7066]">Game</th>
            <th scope="col" class="text-[#718079] light:text-[#5d7066]">Player</th>
            <th scope="col" class="text-[#718079] light:text-[#5d7066]">Time</th>
            <th scope="col" class="text-[#718079] light:text-[#5d7066]">Multiplier</th>
            <th scope="col" class="amount-column text-[#718079] light:text-[#5d7066]">Win Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="`${row.player}-${row.time}`">
            <td>
              <span class="game-miniature">{{ row.gameSymbol }}</span>
              <strong>{{ row.game }}</strong>
            </td>
            <td class="muted">{{ row.player }}</td>
            <td class="muted">{{ row.time }}</td>
            <td><span class="multiplier text-[#73e2b9] light:text-[#019440] light:bg-[#019440]/10">{{ row.multiplier }}</span></td>
            <td class="amount-column text-[#b6f4dc] light:text-[#026b34]">
              <span class="currency-icon text-[#08100c] bg-[#56d4a6]">₮</span>
              <strong>{{ row.amount }}</strong>
              <small class="text-[#718079] light:text-[#5d7066]">{{ row.currency }}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.demo-label {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.4rem;
  border-radius: 0.3rem;
  font-size: 0.53rem;
  font-weight: 650;
  background: rgba(255, 255, 255, 0.04);
  gap: 0.25rem;
}

.table-shell {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

table {
  width: 100%;
  min-width: 44rem;
  border-collapse: collapse;
}

th {
  height: 2.65rem;
  font-size: 0.58rem;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(255, 255, 255, 0.018);
}

th,
td {
  padding: 0 1rem;
}

td {
  height: 3.55rem;
  border-top: 1px solid var(--border);
  color: var(--text);
  font-size: 0.66rem;
}

td:first-child {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.game-miniature {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.38rem;
  color: white;
  font-family: Georgia, serif;
  background: linear-gradient(135deg, var(--brand), #13271f);
}

.muted {
  color: var(--secondary);
}

.multiplier {
  display: inline-block;
  min-width: 3rem;
  padding: 0.22rem 0.35rem;
  border-radius: 0.3rem;
  text-align: center;
  background: rgba(50, 212, 154, 0.08);
}

.amount-column {
  text-align: right;
}

.currency-icon {
  display: inline-grid;
  width: 1.1rem;
  height: 1.1rem;
  margin-right: 0.35rem;
  place-items: center;
  border-radius: 50%;
  font-size: 0.55rem;
  font-weight: 850;
}

.amount-column small {
  margin-left: 0.25rem;
  font-size: 0.5rem;
}
</style>
