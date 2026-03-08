import createImageUrlBuilder from '@sanity/image-url'
type SanityImageSource = any;

import { dataset, projectId } from './env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlForImage = (source: SanityImageSource) => {
    return builder.image(source)
}
