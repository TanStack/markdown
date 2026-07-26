import type { MarkdownComponents, MarkdownReactOptions } from '../src/react.js'

export const intrinsicComponents: MarkdownComponents = {
  a(props) {
    const href: string | undefined = props.href
    // @ts-expect-error Anchor overrides should not receive image-only props.
    props.src
    return <a {...props} data-href={href} />
  },
  img(props) {
    const src: string | undefined = props.src
    // @ts-expect-error Image overrides should not receive anchor-only props.
    props.href
    return <span data-src={src}>{props.alt}</span>
  },
}

function CustomPanel(props: { 'data-kind'?: string }) {
  return <section data-kind={props['data-kind']} />
}

export const flexibleComponents: MarkdownComponents = {
  a: 'span',
  'md-custom-panel': CustomPanel,
}

export const invalidComponents: MarkdownComponents = {
  // @ts-expect-error An anchor override cannot require an image source.
  a: (props: { src: string }) => <span>{props.src}</span>,
}

// MarkdownReactOptions retains the permissive pre-0.0.12 component contract.
export const backwardsCompatibleOptions: MarkdownReactOptions = {
  components: {
    a: (props: { src: string }) => <span>{props.src}</span>,
  },
}
