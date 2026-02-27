'use client'

import { CommentSection } from './CommentSection'
import { LikeButton } from './LikeButton'

export function PostInteractions({ slug }: { slug: string }) {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-4 mb-2">
        <LikeButton slug={slug} />
      </div>
      <CommentSection slug={slug} />
    </div>
  )
}
