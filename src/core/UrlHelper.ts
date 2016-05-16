export class UrlHelper {
  public static removeTrailingSlash(url: string): string{
    return url.replace(/\/$/, '');
  }
}
