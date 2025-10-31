import { ApiProperty } from '@nestjs/swagger';

import { CourseResponse } from '@/api/controller/courses/course.response';

import { Course } from '@/domain/courses/course';
import { Enrollment } from '@/domain/enrollments/enrollment';
import { LectureProgress } from '@/domain/enrollments/lecture-progress';
import { Lecture } from '@/domain/lectures/lecture';
import { Section } from '@/domain/sections/section';

/**
 * 수강 정보 응답
 */
export class EnrollmentResponse {
  @ApiProperty({ description: '수강 ID' })
  id: string;

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ description: '강의 ID' })
  courseId: string;

  @ApiProperty({ description: '수강 시작 시각' })
  enrolledAt: Date;

  @ApiProperty({ description: '수강 만료 시각 (null이면 평생)', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ description: '마지막 접근 시각', nullable: true })
  lastAccessedAt: Date | null;

  @ApiProperty({ description: '진행률 (0-100)', example: 45 })
  progress: number;

  @ApiProperty({ description: '완료 여부' })
  isCompleted: boolean;

  @ApiProperty({ description: '완료 시각', nullable: true })
  completedAt: Date | null;

  constructor(enrollment: Enrollment) {
    this.id = enrollment.id;
    this.userId = enrollment.userId;
    this.courseId = enrollment.courseId;
    this.enrolledAt = enrollment.enrolledAt;
    this.expiresAt = enrollment.expiresAt;
    this.lastAccessedAt = enrollment.lastAccessedAt;
    this.progress = enrollment.progress;
    this.isCompleted = enrollment.isCompleted;
    this.completedAt = enrollment.completedAt;
  }
}

/**
 * 수강 중인 강의 목록 응답 (진행률 포함)
 */
export class EnrollmentWithCourseResponse {
  @ApiProperty({ description: '수강 정보' })
  enrollment: EnrollmentResponse;

  @ApiProperty({ description: '강의 정보' })
  course: CourseResponse;

  constructor(enrollment: Enrollment, course: Course) {
    this.enrollment = new EnrollmentResponse(enrollment);
    this.course = new CourseResponse(
      course.id,
      course.slug,
      course.title,
      course.description,
      course.thumbnailUrl,
      course.price,
      course.level,
      course.status,
      course.createdAt,
    );
  }
}

/**
 * 개별 강의 진행률 응답
 */
export class LectureProgressResponse {
  @ApiProperty({ description: '진행률 ID' })
  id: string;

  @ApiProperty({ description: '수강 ID' })
  enrollmentId: string;

  @ApiProperty({ description: '강의 ID' })
  lectureId: string;

  @ApiProperty({ description: '시청 시간 (초 단위)', example: 120 })
  watchTime: number;

  @ApiProperty({ description: '완료 여부' })
  isCompleted: boolean;

  @ApiProperty({ description: '완료 시각', nullable: true })
  completedAt: Date | null;

  constructor(progress: LectureProgress) {
    this.id = progress.id;
    this.enrollmentId = progress.enrollmentId;
    this.lectureId = progress.lectureId;
    this.watchTime = progress.watchTime;
    this.isCompleted = progress.isCompleted;
    this.completedAt = progress.completedAt;
  }
}

/**
 * 강의 상세 정보 (비디오 URL 포함)
 */
export class EnrolledLectureResponse {
  @ApiProperty({ description: '강의 ID' })
  id: string;

  @ApiProperty({ description: '강의 제목' })
  title: string;

  @ApiProperty({ description: '강의 설명', nullable: true })
  description: string | null;

  @ApiProperty({ description: '순서' })
  order: number;

  @ApiProperty({ description: '재생 시간 (초 단위)', nullable: true })
  duration: number | null;

  @ApiProperty({ description: '비디오 URL', nullable: true })
  videoUrl: string | null;

  @ApiProperty({ description: '미리보기 가능 여부' })
  isPreview: boolean;

  @ApiProperty({ description: '섹션 ID' })
  sectionId: string;

  @ApiProperty({ description: '강의 진행률 (있는 경우)', nullable: true, type: LectureProgressResponse })
  progress: LectureProgressResponse | null;

  constructor(lecture: Lecture, progress: LectureProgress | null) {
    this.id = lecture.id;
    this.title = lecture.title;
    this.description = lecture.description;
    this.order = lecture.order;
    this.duration = lecture.duration;
    this.videoUrl = lecture.videoUrl;
    this.isPreview = lecture.isPreview;
    this.sectionId = lecture.sectionId;
    this.progress = progress ? new LectureProgressResponse(progress) : null;
  }
}

/**
 * 섹션 정보 (수강 중인 강의 전용)
 */
export class EnrolledSectionResponse {
  @ApiProperty({ description: '섹션 ID' })
  id: string;

  @ApiProperty({ description: '섹션 제목' })
  title: string;

  @ApiProperty({ description: '순서' })
  order: number;

  @ApiProperty({ description: '강의 목록', type: [EnrolledLectureResponse] })
  lectures: EnrolledLectureResponse[];

  constructor(section: Section, lectures: EnrolledLectureResponse[]) {
    this.id = section.id;
    this.title = section.title;
    this.order = section.order;
    this.lectures = lectures;
  }
}

/**
 * 수강 중인 강의 상세 정보 (비디오 URL 포함)
 */
export class EnrolledCourseDetailResponse {
  @ApiProperty({ description: '강의 ID' })
  id: string;

  @ApiProperty({ description: '강의 slug' })
  slug: string;

  @ApiProperty({ description: '강의 제목' })
  title: string;

  @ApiProperty({ description: '강의 설명' })
  description: string;

  @ApiProperty({ description: '섹션 목록', type: [EnrolledSectionResponse] })
  sections: EnrolledSectionResponse[];

  @ApiProperty({ description: '수강 정보' })
  enrollment: EnrollmentResponse;

  constructor(course: Course, enrollment: Enrollment, sections: EnrolledSectionResponse[]) {
    this.id = course.id;
    this.slug = course.slug;
    this.title = course.title;
    this.description = course.description;
    this.sections = sections;
    this.enrollment = new EnrollmentResponse(enrollment);
  }
}

/**
 * 진행률 업데이트 응답
 */
export class UpdateProgressResponse {
  @ApiProperty({ description: '강의 진행률' })
  lectureProgress: LectureProgressResponse;

  @ApiProperty({ description: '수강 정보 (전체 진행률 포함)' })
  enrollment: EnrollmentResponse;

  constructor(lectureProgress: LectureProgress, enrollment: Enrollment) {
    this.lectureProgress = new LectureProgressResponse(lectureProgress);
    this.enrollment = new EnrollmentResponse(enrollment);
  }
}
