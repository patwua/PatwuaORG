import type { PostType } from '@/types/post';

export default function PostMedia({ media }: { media: NonNullable<PostType['media']> }) {
  return (
    <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700">
      {media.type === 'image' && (
        <img
          src={media.url}
          alt="Post media"
          className="object-cover w-full h-full"
        />
      )}
      {media.type === 'video' && (
        <video
          src={media.url}
          controls
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
