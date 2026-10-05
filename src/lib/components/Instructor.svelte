<script lang="ts">
  import { base } from '$app/paths';
  import type { CourseContent } from '$lib/types';

  let { instructor }: { instructor: CourseContent['instructor'] } = $props();
</script>

<section
  class="instructor-section section"
  id="instructor"
  aria-labelledby="instructor-title"
>
  <div class="container">
    <div class="section-header">
      <p class="section-kicker">{instructor.kicker}</p>
      <h2 id="instructor-title">{instructor.title}</h2>
    </div>
    <p class="section-intro">{instructor.description}</p>
    <div class="instructor-profile">
      <a
        class="instructor-avatar"
        href={instructor.profileUrl}
        aria-label={'Read more about ' + instructor.name}
      >
        {#if instructor.photo}
          <img src={base + '/' + instructor.photo} alt="" loading="lazy" />
        {/if}
      </a>
      <div class="instructor-copy">
        <div class="instructor-details">
          <h3>{instructor.name}</h3>
          <p class="instructor-affiliation">{instructor.role}</p>
        </div>
        <p class="instructor-bio">
          {instructor.bio}<a href={'mailto:' + instructor.email}>{instructor.email}</a>.
        </p>
      </div>
    </div>
  </div>
</section>
