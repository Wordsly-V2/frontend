import Image from "next/image";

export default function CourseCard({
    course,
    onCourseClick,
}: {
    course: {
        id: string;
        title: string;
        cover: string;
        vocabCount: number;
        partsCount: number;
    };
    onCourseClick?: () => void;
}) {
    return (
        <article
            key={course.id}
            className='group rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow overflow-hidden'
        >
            <div className='relative h-40 w-full overflow-hidden'>
                <Image
                    src={course.cover}
                    alt={`Cover ${course.title}`}
                    className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    loading='lazy'
                    width={100}
                    height={100}
                />
            </div>
            <div className='p-4 space-y-3'>
                <h2 className='text-base font-semibold leading-snug line-clamp-2'>
                    {course.title}
                </h2>
                <div className='flex items-center justify-between text-sm text-muted-foreground'>
                    <span>{course.vocabCount} từ vựng</span>
                    <span>{course.partsCount} phần</span>
                </div>
                <button
                    type='button'
                    className='w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2 hover:opacity-90 transition-opacity'
                    onClick={onCourseClick}
                >
                    Vào học
                </button>
            </div>
        </article>
    );
}
