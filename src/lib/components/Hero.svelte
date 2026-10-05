<script lang="ts">
  import type { CourseContent } from '$lib/types';

  let {
    course,
    instructor,
    homeHref
  }: {
    course: CourseContent['course'];
    instructor: CourseContent['instructor'];
    homeHref?: string;
  } = $props();
</script>

<section class="hero" aria-labelledby="course-title">
  <div class="container hero-main">
    <div class="hero-copy">
      <p class="hero-kicker">
        {course.term} <span aria-hidden="true">/</span>
        {course.code}
      </p>
      {#if homeHref}
        <p class="hero-title" id="course-title">
          <a href={homeHref}>Truth-Telling 101</a>
        </p>
      {:else}
        <h1 class="hero-title" id="course-title">Truth-Telling 101</h1>
      {/if}
      <p class="hero-proposition">{course.proposition}</p>
    </div>
  </div>

  <div class="hero-meta-wrap">
    <div class="container hero-meta" aria-label="Class at a glance">
      <div class="hero-meta-item">
        <span class="meta-label">Instructor</span>
        <strong><a href={instructor.profileUrl}>{instructor.name}</a></strong>
        <span>{instructor.role}</span>
      </div>
      <div class="hero-meta-item">
        <span class="meta-label">{course.meetingLabel}</span>
        <strong>{course.dateRange}</strong>
        <span>{course.time}</span>
      </div>
      <div class="hero-meta-item">
        <span class="meta-label">Location</span>
        <strong>{course.location}</strong>
        <span>{course.room}</span>
      </div>
    </div>
  </div>
</section>
