export abstract class ApiBase {
    private readonly baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://qurancorpus.app/api';

    protected url = (relativePath: string) => this.baseUrl + relativePath;
}