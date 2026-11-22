export default function ActorLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-5 w-24 bg-theme-surface-subtle rounded mb-6" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 aspect-[2/3] bg-theme-surface-subtle border border-theme-border rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <div className="h-10 w-2/3 bg-theme-surface-subtle rounded mb-3" />
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-theme-surface-subtle rounded-full" />
              <div className="h-6 w-32 bg-theme-surface-subtle rounded-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="h-5 w-28 bg-theme-surface-subtle rounded" />
            <div className="h-4 w-full bg-theme-surface-subtle rounded" />
            <div className="h-4 w-5/6 bg-theme-surface-subtle rounded" />
            <div className="h-4 w-4/6 bg-theme-surface-subtle rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
