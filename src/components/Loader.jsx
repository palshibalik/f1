import { PageLoader, SkeletonPage, SkeletonList, 
         SkeletonDriver, CardSkeleton, InlineSpinner } from "../components/Loader";

// Full page spinner while fetching
if (loading) return <PageLoader />;

// Full page shimmer layout (title + card grid)
if (loading) return <SkeletonPage />;

// Standings / news style shimmer
if (loading) return <SkeletonList rows={10} />;

// Driver card grid shimmer
if (loading) return <SkeletonDriver count={20} />;

// Tiny spinner inside a button
<InlineSpinner size={14} />