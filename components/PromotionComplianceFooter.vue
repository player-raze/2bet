<template>
  <footer class="promotion-compliance text-white" aria-label="Responsible gaming information">
    <div class="promotion-compliance__badges">
      <img
        src="/responsible-gaming/pagcor.webp"
        alt="PAGCOR"
        width="175"
        height="175"
        class="bg-white rounded-full p-[0.08rem]"
        loading="lazy"
        decoding="async"
      >
      <img
        src="/responsible-gaming/age-restriction.webp"
        alt="Gambling can be addictive. Know when to stop. 21 and above only."
        width="88"
        height="32"
        class="bg-white rounded-[0.36rem] px-[0.32rem] py-[0.25rem]"
        loading="lazy"
        decoding="async"
      >
    </div>

    <p class="promotion-compliance__links text-[#e43232]">
      <span>WWW.PAGCOR.PH/REGULATORY</span>
      <span>KEEPITFUN@PAGCOR.PH</span>
    </p>

    <p class="promotion-compliance__message text-[#315fba]">
      GAMBLING DOESN'T GUARANTEE EARNINGS OR<br>
      FINANCIAL IMPROVEMENT. STAY WITHIN YOUR<br>
      LIMITS.
    </p>

    <img
      class="promotion-compliance__hotline bg-white rounded-[0.2rem] p-[0.2rem]"
      src="/responsible-gaming/support-hotline.webp"
      alt="Responsible gaming support hotline"
      width="130"
      height="72"
      loading="lazy"
      decoding="async"
    >
  </footer>
</template>

<style scoped>
.promotion-compliance {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-height: 12.5rem;
  padding: 1.8rem 1rem 2rem;
  text-align: center;
}

.promotion-compliance__badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
}

.promotion-compliance__badges img:first-child {
  width: 2.55rem;
  height: 2.55rem;
  object-fit: contain;
}

.promotion-compliance__badges img:last-child {
  width: 5.6rem;
  height: 2.25rem;
  object-fit: contain;
}

.promotion-compliance__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0.7rem 0 0;
  font-size: 0.42rem;
  font-weight: 800;
  gap: 0.7rem;
}

.promotion-compliance__message {
  margin: 0.38rem 0 0.55rem;
  font-size: 0.52rem;
  font-weight: 800;
  line-height: 1.35;
}

.promotion-compliance__hotline {
  width: 4.5rem;
  height: auto;
  object-fit: contain;
}

@media (max-width: 40rem) {
  .promotion-compliance {
    min-height: 10rem;
    padding-bottom: 4.6rem;
  }
}
</style>
