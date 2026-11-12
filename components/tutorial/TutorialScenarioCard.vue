<script setup lang="ts">
type TutorialOutcomeStatus = 'win' | 'lose' | 'refund' | 'win-half' | 'lose-half'
type TutorialOptionTone = 'home' | 'draw' | 'away'

interface TutorialVisualOption {
  label: string
  value?: string
  status: TutorialOutcomeStatus
  tone: TutorialOptionTone
}

interface TutorialScenario {
  score: string
  description: string
  subtitle?: string
  image?: string
  options: TutorialVisualOption[]
}

defineProps<{
  scenario: TutorialScenario
}>()
</script>

<template>
  <article class="tutorial-scenario-card bg-[#141414] light:bg-white border border-white/5 light:border-[#d8e2dc] light:shadow-sm text-[#f2f2f2] light:text-[#10261c]">
    <h3 class="text-[#f4f4f4] light:text-[#10261c]">{{ scenario.score }}</h3>
    <p v-if="scenario.subtitle" class="tutorial-scenario-subtitle text-[#f1f1f1] light:text-[#2a3c33]">{{ scenario.subtitle }}</p>
    <p class="tutorial-scenario-description text-[#f0f0f0] light:text-[#5d7066]">{{ scenario.description }}</p>
    <TutorialOutcomeGraphic :options="scenario.options" :src="scenario.image" />
  </article>
</template>

<style scoped>
.tutorial-scenario-card {
  display: flex;
  height: 230px;
  min-width: 0;
  overflow: hidden;
  flex-direction: column;
  padding: 14px 12px 0;
  border-radius: 11px;
}

.tutorial-scenario-card h3 {
  margin: 0;
  font-size: 30px;
  font-weight: 400;
  line-height: 1.08;
  text-align: center;
}

.tutorial-scenario-subtitle {
  margin: 7px 0 0;
  font-size: 13px;
  line-height: 1.2;
  text-align: center;
}

.tutorial-scenario-description {
  min-height: 32px;
  margin: 8px 0 0;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.35;
}

.tutorial-scenario-subtitle + .tutorial-scenario-description {
  margin-top: 5px;
}

@media (max-width: 46rem) {
  .tutorial-scenario-card {
    height: 220px;
  }

  .tutorial-scenario-card h3 {
    font-size: 26px;
  }
}
</style>
