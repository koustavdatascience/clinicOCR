type TokenResolver = () => Promise<string | null>;

let resolver: TokenResolver = async () => null;

export function setClerkTokenResolver(nextResolver: TokenResolver) {
  resolver = nextResolver;
}

export async function getClerkToken() {
  return resolver();
}
