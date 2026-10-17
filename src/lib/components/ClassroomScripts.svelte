<script lang="ts">
  import { base } from '$app/paths';
  import type { CourseContent } from '$lib/types';

  let { schedule }: { schedule: CourseContent['schedule'] } = $props();
  const firstWeek = $derived(schedule.weeks[0]);
</script>

<section class="schedule-section" id="schedule" aria-labelledby="scripts-title">
  <div class="container">
    <div class="section-header">
      <p class="section-kicker">{schedule.kicker}</p>
      <h2 id="scripts-title">{schedule.title}</h2>
    </div>
    <p class="section-intro">{schedule.note}</p>
    {#if firstWeek}
      {#if firstWeek.href}
        <a class="script-card" href={base + firstWeek.href}>
          <span class="week-number">Week 01</span>
          <h3>{firstWeek.topic}</h3>
          <p>{firstWeek.displayDate}</p>
        </a>
      {:else}
        <div class="script-card script-card-disabled" aria-disabled="true">
          <span class="week-number">Week 01</span>
          <h3>{firstWeek.topic}</h3>
          <p>{firstWeek.displayDate}</p>
        </div>
      {/if}
    {/if}

    <div class="classroom-tool">
      <div>
        <p class="week-number">Classroom tool</p>
        <h3>Critique wheel</h3>
        <p>
          Randomly set a presentation order, choose a reviewer, and offer a feedback
          prompt.
        </p>
      </div>
      <a class="classroom-tool-link" href={base + '/critique-wheel/'}>
        Open the critique wheel <span aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>
