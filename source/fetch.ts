
import { validate } from './properties';


/** Namespace that comprises various utils (also cleans up documentation). */
namespace fetch {

    const failed = (url: string, request: XMLHttpRequest) =>
        `fetching '${url}' failed (${request.status}): ${request.statusText}`;

    /**
     * Creates a promise for an asynchronous xml/http request on a given URL. If an URL is fetched successfully, the
     * promise is resolved with a parsed JSON object. An error code and message can be caught otherwise.
     * @param url - Uniform resource locator string referencing a JSON file.
     * @param transform - Callback to a function that transforms the fetched data into an instance of targeted type.
     * @returns - A promise that resolves on a parsed JSON object if successful.
     */
    export function fetchAsync<T>(url: string, transform: { (data: any): T }): Promise<T> {

        const response = new Promise<T>((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', url, true);

            request.onload = () => {
                if (request.status < 200 || request.status >= 300) {
                    reject(failed(url, request));
                    return;
                }

                const data = request.responseText;
                const object: T = transform(data);
                resolve(object);
            };

            request.onerror = () => reject(failed(url, request));
            request.ontimeout = () => reject(failed(url, request));

            request.send();
        });
        return response;
    }

    export interface FetchTransform<T> { (data: any): T | undefined; }

    /**
     * Creates a promise for an asynchronous xml/http request on a given URL. If an URL is fetched successfully, the
     * promise is resolved with a parsed JSON object. An error code and message can be caught otherwise.
     * @param url - Uniform resource locator string referencing a JSON file.
     * @param transform - Callback to a function that transforms the fetched data into an instance of targeted type.
     * @param schema - Optional schema, that if specified, is used to validate the fetched json data.
     * @returns - A promise that resolves on a parsed JSON object if successful.
     */
    export function fetchJsonAsync<T>(url: string, transform: FetchTransform<T>, schema?: any): Promise<T> {

        const response = new Promise<T>((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', url, true);

            request.onload = () => {
                if (request.status < 200 || request.status >= 300) {
                    reject(failed(url, request));
                    return;
                }

                const json = request.responseText;
                if (schema !== undefined && !validate(json, schema)) {
                    return;
                }

                let data: any;
                try {
                    data = JSON.parse(json);
                } catch (error) {
                    reject(`fetching '${url}' failed (${error.name}): ${error.message}`);
                    return;
                }

                const object = transform(data);
                if (object === undefined) {
                    reject(`fetching '${url}' failed (TransformError): transforming the object failed.`);
                    return;
                }
                resolve(object);
            };

            request.onerror = () => reject(failed(url, request));
            request.ontimeout = () => reject(failed(url, request));

            request.send();
        });
        return response;
    }

}

export = fetch;
