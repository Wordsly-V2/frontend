import Image from "next/image";

export default function CoursesPage() {
  const courses = [
    {
      id: "toeic-essentials",
      title: "TOEIC Essentials",
      cover:
        "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop",
      vocabCount: 560,
      partsCount: 8,
    },
    {
      id: "daily-english",
      title: "English giao tiếp hằng ngày",
      cover:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop",
      vocabCount: 420,
      partsCount: 6,
    },
    {
      id: "business-vocab",
      title: "Business Vocabulary",
      cover:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1600&auto=format&fit=crop",
      vocabCount: 380,
      partsCount: 5,
    },
    {
      id: "travel-english",
      title: "English du lịch",
      cover:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
      vocabCount: 240,
      partsCount: 4,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Khóa học của tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chọn khóa học để bắt đầu học từ vựng.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <article
            key={course.id}
            className="group rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
          >
            <div className="relative h-40 w-full overflow-hidden">
              <Image
                src={course.cover}
                alt={`Cover ${course.title}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4 space-y-3">
              <h2 className="text-base font-semibold leading-snug line-clamp-2">
                {course.title}
              </h2>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{course.vocabCount} từ vựng</span>
                <span>{course.partsCount} phần</span>
              </div>
              <button
                type="button"
                className="w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2 hover:opacity-90 transition-opacity"
              >
                Vào học
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}