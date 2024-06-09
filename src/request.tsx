import { createRoot } from 'react-dom/client';
import { type OpenAPIV3_1 } from 'openapi-types';
import {
  Accordion,
  Badge,
  Button,
  Select,
  TextInput,
} from "flowbite-react";
import { useState } from 'react';

interface FormObject {
  name: string,
  description: string | undefined,
  type: string,
  isRequired: boolean | undefined
  in: string
  isValid: boolean,
  value: string,
  validationFn?: (value: string) => string | undefined
}

/**
 * gets parameters for an API like headers, path param or query
 * 
 * @param pathItem the main root object of the API
 * @returns array of FieldObject
 */
function getParamFields(pathItem: OpenAPIV3_1.OperationObject): FormObject[] {
  let formFields: FormObject[] = [];
  if (!pathItem.parameters) return formFields;

  for (let param of pathItem.parameters as OpenAPIV3_1.ParameterObject[]) {
    // form field
    const ff: FormObject = {
      name: param.name,
      description: param.description,
      type: 'string',
      isRequired: param.required,
      in: param.in,
      isValid: true,
      value: "",
    };

    if (ff.isRequired) {
      ff.validationFn = (value: string) => value.length > 0 ? undefined : `${ff.name} is required`
    }

    formFields.push(ff);
  }

  return formFields;
}


/**
 * gets request body of the API.
 * 
 *  ```FIXME: it should also return the media and media-type for use while making
 * API request.```
 * 
 * @param pathItem the main root object of the API
 * @returns array of FieldObject
 */
function getBodyFields(pathItem: OpenAPIV3_1.OperationObject): FormObject[] {
  let formFields: FormObject[] = [];
  if (!pathItem.requestBody) return formFields;


  let reqbody = pathItem.requestBody as OpenAPIV3_1.RequestBodyObject;

  // FIXME: here also there can be multiple media bodies
  const mediakey = Object.keys(reqbody.content).at(0)!;
  const media = reqbody.content[mediakey];
  const schema = media.schema as OpenAPIV3_1.SchemaObject;

  switch (schema.type) {
    case "object":
      for (const prop of Object.keys(schema.properties as OpenAPIV3_1.SchemaObject)) {

        const ff: FormObject = {
          name: prop,
          description: schema.properties![prop]?.description, // TODO: proper null check here
          type: schema.type,
          isRequired: schema.required?.includes(prop),
          in: 'body',
          isValid: true,
          value: ''
        };

        if (ff.isRequired) {
          ff.validationFn = (value: string) => value.length > 0 ? undefined : `${ff.name} is required`
        }

        formFields.push(ff);
      }
      break;
    // TODO: case "array":
    default:
      break;
  }

  return formFields;
}

function RequestComponent(props: { req: OpenAPIV3_1.PathsObject }) {
  const formFields: FormObject[] = [];

  // FIXME: ideally: we should not pick the first object and process it, we should
  // process all the keys inside the path object
  const path = Object.keys(props.req)[0];
  const req = props.req[path]!;
  const method = Object.keys(req)[0];
  let pathItemObject: OpenAPIV3_1.OperationObject;
  let bgColor = 'warning';
  switch (method) {
    case "get":
      pathItemObject = req.get!;
      break;
    case "post":
      bgColor = 'pink';
      pathItemObject = req.post!;
      break;
    case "put":
      bgColor = 'success';
      pathItemObject = req.put!;
      break;
    case "delete":
      bgColor = 'failure';
      pathItemObject = req.delete!;
      break;
    case "patch":
      bgColor = 'purple';
      pathItemObject = req.patch!;
      break;
    default:
      return <ErrorComponent msg='unknown HTTP method' />
  }

  // these are non-body inputs, like headers, params and query
  const paramFields = getParamFields(pathItemObject);
  formFields.push(...paramFields);

  const bodyFields = getBodyFields(pathItemObject);
  formFields.push(...bodyFields);


  const [selectedServer, setServer] = useState(pathItemObject?.servers?.at(0)?.url);
  const [response, setResponse] = useState("");

  const [fieldState, setFieldState] = useState(formFields);

  const hasInvalidFields = (): boolean => {
    let dirty = false;
    const nfs = fieldState.map(field => {
      // check if there is any validation function and you check fof validity if it exists
      if (field.validationFn && field.validationFn(field.value)) {
        // new field state
        field.isValid = false;
        dirty = true;
      }
      return field;
    });

    if (dirty) {
      setFieldState(nfs);
    }
    return dirty;
  }

  const clearInvalidFields = () => {
    const nfs = fieldState.map(fs => {
      fs.isValid = true;
      return fs;
    });
    setFieldState(nfs);
  }

  const startFetching = async () => {
    if (hasInvalidFields()) return;
    clearInvalidFields()

    // TODO: remove this!!
    let media = {};
    switch (method) {
      // TODO: support other methods
      case 'get':
      default:
        switch (media) {
          // TODO: support other medias
          default:
            const params = new URLSearchParams();
            const headers: HeadersInit = {
              "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
              "Accept": "application/json, text/plain, */*",
              "sec-ch-ua-platform": "Android",
              "sec-ch-ua-mobile": "?1",
            };
            for (let field of fieldState) {
              switch (field.in) {
                case "header":
                  headers[field.name] = field.value;
                  break;
                case "param":
                  params.set(field.name, field.value);
                  break;
                default:
                  continue;
              }
            }

            const options: RequestInit = {
              method: "GET",
              cache: "no-cache",
              headers,
            };

            console.log('options:', options);
            let res = await fetch(`${selectedServer}${path}?${params.toString()}`, options);
            if (!pathItemObject?.responses) {
              // assume that response is a JSON one
              res = await res.json();
              let displayRes = JSON.stringify(res, null, 2);
              setResponse(displayRes);
              return;
            }

            res = await res.json();
            let displayRes = JSON.stringify(res, null, 2);
            setResponse(displayRes);
          // let responseCodes = Object.keys(pathItemObject?.responses).map(r => Number(r));
        }
    }
  };

  return (
    <>
      <Accordion collapseAll>
        <Accordion.Panel>
          <Accordion.Title>
            <div className="flex flex-wrap gap-2">
              <Badge color={bgColor}>{method}</Badge> <code>{path}</code>
            </div>

          </Accordion.Title>

          <Accordion.Content>
            <div className="max-w-md">
              <div className="mb-2 block">
              </div>
              <Select id="servers" required onChange={(e) => setServer(e.target.value)}>
                {pathItemObject?.servers?.length && pathItemObject?.servers?.map(s => <option>{s.url}</option>)}
              </Select>
            </div>

            {pathItemObject?.description}

            <div style={{ padding: '1em' }}>
              {fieldState.map((ff, fi) => {
                return (<TextInput
                  color={ff.isValid ? 'grey' : 'failure'}
                  onChange={(e) => {
                    // new field state
                    const nfs = fieldState.map((fs, nfi) => {
                      if (nfi == fi) {
                        fs.value = e.target.value;
                      }
                      return fs;
                    });
                    setFieldState(nfs);
                  }}
                  value={ff.value}
                  placeholder={ff.name}
                  helperText={ff.description} />)
              })}

              <Button outline gradientDuoTone="purpleToPink" onClick={startFetching}>Send</Button>
            </div>


            {response != "" ? <pre style={{ maxHeight: '200px', overflow: 'scroll' }}>
              {response}
            </pre> : <></>}
          </Accordion.Content>

        </Accordion.Panel>
      </Accordion>
    </>)
}

function ErrorComponent(props: { msg: string }) {
  return (<>
    <span style={{ color: 'red' }}>{props.msg}</span>
  </>)
}

function render(container: HTMLElement, data: string) {
  const root = createRoot(container);
  try {
    const singleRequest = JSON.parse(data) as OpenAPIV3_1.PathsObject;
    root.render(<RequestComponent req={singleRequest} />);
  } catch (e: any) {
    root.render(<ErrorComponent msg={e.message} />);
  }
}

export {
  render
}