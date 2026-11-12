<script setup lang="ts">
import { ArrowUpRight, Radio, Users } from 'lucide-vue-next'
import type { CasinoGame } from '~/types/casino'

defineProps<{
  games: CasinoGame[]
}>()

const emit = defineEmits<{
  'launch-demo': [title: string]
}>()
</script>

<template>
  <section id="live-casino" class="content-section" aria-labelledby="live-casino-title">
    <div class="section-heading">
      <div>
        <span class="heading-icon"><Radio :size="16" /></span>
        <h2 id="live-casino-title">Live Casino</h2>
        <span class="live-pulse text-[#7d8d85] light:text-[#5d7066]"><i /> Live now</span>
      </div>
      <a href="#live-casino">View All <ArrowUpRight :size="14" /></a>
    </div>

    <div class="live-grid">
      <button
        v-if="games[0]"
        type="button"
        class="live-card live-card--featured text-white"
        :style="{ '--live-accent': games[0].accent }"
        @click="emit('launch-demo', games[0].title)"
      >
        <span class="live-visual">
          <i class="live-orbit" />
          <b>{{ games[0].symbol }}</b>
        </span>
        <span class="live-details">
          <small class="text-[#ff9097]"><i /> LIVE</small>
          <strong>{{ games[0].title }}</strong>
          <span class="text-white/60">{{ games[0].provider }}</span>
          <em class="text-white/60"><Users :size="12" /> {{ games[0].viewers }}</em>
        </span>
      </button>

      <div class="live-small-grid">
        <button
          v-for="game in games.slice(1)"
          :key="game.id"
          type="button"
          class="live-card live-card--small text-white"
          :style="{ '--live-accent': game.accent }"
          @click="emit('launch-demo', game.title)"
        >
          <span class="live-visual">
            <i class="live-orbit" />
            <b>{{ game.symbol }}</b>
          </span>
          <span class="live-details">
            <small class="text-[#ff9097]"><i /> LIVE</small>
            <strong>{{ game.title }}</strong>
            <em class="text-white/60"><Users :size="11" /> {{ game.viewers }}</em>
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.live-pulse {
  display: inline-flex;
  align-items: center;
  font-size: 0.58rem;
  font-weight: 650;
  gap: 0.3rem;
}

.live-pulse i,
.live-details small i {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: #ff5964;
  box-shadow: 0 0 0 3px rgba(255, 89, 100, 0.1);
}

.live-grid {
  display: grid;
  min-height: 24rem;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: var(--card-gap);
}

.live-small-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--card-gap);
}

.live-card {
  display: block;
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius);
  text-align: left;
  background:
    radial-gradient(circle at 60% 26%, color-mix(in srgb, var(--live-accent) 76%, white 8%), transparent 33%),
    linear-gradient(145deg, color-mix(in srgb, var(--live-accent) 65%, #17271f), #09100c);
}

.live-card:hover {
  filter: brightness(1.08);
}

.live-card::after {
  position: absolute;
  inset: 35% 0 0;
  background: linear-gradient(transparent, rgba(3, 6, 4, 0.9));
  content: '';
}

.live-visual {
  position: absolute;
  inset: 0;
}

.live-orbit {
  position: absolute;
  top: -12%;
  right: -10%;
  width: 76%;
  aspect-ratio: 1;
  border: 1rem solid rgba(255, 255, 255, 0.055);
  border-radius: 50%;
}

.live-visual b {
  position: absolute;
  top: 42%;
  left: 56%;
  font-family: Georgia, serif;
  font-size: clamp(3.5rem, 8vw, 7rem);
  line-height: 1;
  text-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.45);
  transform: translate(-50%, -50%) rotate(5deg);
}

.live-details {
  display: flex;
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.25rem;
}

.live-details small {
  display: inline-flex;
  align-items: center;
  margin-bottom: 0.45rem;
  font-size: 0.52rem;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.08em;
  gap: 0.35rem;
}

.live-details strong {
  font-size: 1.25rem;
  letter-spacing: -0.035em;
}

.live-details > span {
  margin-top: 0.15rem;
  font-size: 0.62rem;
}

.live-details em {
  display: flex;
  align-items: center;
  margin-top: 0.45rem;
  font-size: 0.57rem;
  font-style: normal;
  gap: 0.25rem;
}

.live-card--small .live-visual b {
  font-size: clamp(2.3rem, 4vw, 4rem);
}

.live-card--small .live-details {
  padding: 0.8rem;
}

.live-card--small .live-details strong {
  width: 100%;
  overflow: hidden;
  font-size: 0.77rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-card--small .live-details small {
  margin-bottom: 0.3rem;
}

@media (max-width: 48rem) {
  .live-grid {
    min-height: 0;
    grid-template-columns: 1fr;
  }

  .live-card--featured {
    aspect-ratio: 1.65 / 1;
  }

  .live-small-grid {
    grid-auto-columns: minmax(10rem, 48vw);
    grid-auto-flow: column;
    grid-template-columns: none;
    margin-right: calc(var(--page-padding) * -1);
    padding-right: var(--page-padding);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .live-card--small {
    aspect-ratio: 1.05 / 1;
  }
}
</style>
