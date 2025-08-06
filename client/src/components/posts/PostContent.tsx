export default function PostContent({ content }: { content: string }) {
  return (
    <div className="p-4">
      <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">
        {content}
      </p>
    </div>
  );
}
