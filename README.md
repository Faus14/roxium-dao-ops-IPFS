# Helia + Storacha (flujo básico)

Este proyecto es un ejemplo mínimo de cómo:

- Subir un archivo a IPFS usando [Helia](https://github.com/ipfs/helia) y obtener un **CID**.
- Pinear ese archivo en la red de Storacha usando su **CLI**, para obtener una URL pública estable.

## Requisitos

- Node.js 18 o superior (recomendado)
- npm

## Instalación (proyecto Helia)

En la carpeta del proyecto:

```bash
npm install
```

Esto instalará `helia` y `@helia/unixfs`.

## Uso: subir archivo a IPFS con Helia

El script principal es `upload-file.js`. Acepta como argumento la ruta a un archivo local:

```bash
# Opción 1: usando npm script
npm run start -- ./ruta/a/tu-archivo.ext

# Opción 2: directamente con node
node upload-file.js ./ruta/a/tu-archivo.ext
```

Si no pasas argumento, por defecto intentará usar `./ejemplo.pdf`.

### Qué hace el script `upload-file.js`

1. Crea un nodo Helia local.
2. Lee el archivo indicado desde el sistema de archivos.
3. Lo añade a IPFS usando UnixFS.
4. Imprime:
   - El CID del contenido.
   - Una URL de gateway pública para intentar acceder al contenido, por ejemplo:

```text
📦 Archivo subido a IPFS
🔑 CID: baf...
🌍 Gateway: https://ipfs.io/ipfs/baf...
```

## Entendiendo el CID y la URL de Helia

- **CID**: es el identificador de contenido; siempre será el mismo para el mismo contenido con el mismo algoritmo de hash.
- **URL de gateway**: `https://ipfs.io/ipfs/<CID>` es una forma conveniente de pedir ese contenido a la red IPFS a través de un gateway HTTP público.

El hecho de que tengas un CID **no garantiza** que un gateway público pueda recuperar el contenido inmediatamente. Depende de que haya nodos en la red que:

- Guarden ese contenido, y
- Sean accesibles desde Internet.

## Errores típicos de recuperación (504 / no providers)

Puede que al abrir la URL del gateway veas algo como:

> 504 Gateway Timeout: no providers found for the CID

Eso significa que el gateway ha preguntado a la red "¿quién tiene este CID?" y no ha encontrado ningún nodo accesible que lo proporcione dentro del tiempo límite.

Esto suele pasar cuando:

- Solo tu nodo local tiene el contenido.
- Tu nodo está detrás de un router/NAT/firewall o ya se apagó.
- No hay ningún servicio de pinning u otro nodo que también tenga los bloques.

### Cómo mitigarlo

1. **Verifica localmente que el CID funciona**

   Puedes leer el contenido desde tu propia máquina usando Helia:

   ```bash
   node - <<'EOF'
   import { createHelia } from 'helia'
   import { unixfs } from '@helia/unixfs'

   const cidStr = 'PON_AQUI_TU_CID'

   const helia = await createHelia()
   const fsUnix = unixfs(helia)

   const chunks = []
   for await (const chunk of fsUnix.cat(cidStr)) {
     chunks.push(chunk)
   }

   const content = Buffer.concat(chunks).toString()
   console.log('Contenido leído desde Helia local:\n', content)

   await helia.stop()
   EOF
   ```

   Si ves tu contenido, el CID es correcto; el problema es solo de descubrimiento/provisión en la red.

2. **Mantén el nodo corriendo un rato**

   En lugar de crear y parar el nodo inmediatamente tras subir el archivo, puedes mantenerlo encendido unos minutos para que anuncie/proporcione el contenido en el DHT. Cuanto más tiempo esté online y accesible, más fácil será que los gateways lo encuentren.

3. **Usa un pinning service (Storacha)**

   Para que el contenido sea accesible de forma estable desde cualquier lugar (sin depender de tu nodo local), usamos Storacha como servicio de pinning. Storacha guarda el contenido en su red (sobre Filecoin + hot storage) y expone el contenido vía gateways como `storacha.link` o `w3s.link`, de forma que los gateways públicos suelen poder recuperar el CID.

4. **Probar otros gateways**

   A veces, distintos gateways tienen distinta visibilidad y cachés. Puedes probar, por ejemplo:

   - `https://w3s.link/ipfs/<CID>`
   - `https://dweb.link/ipfs/<CID>`

   Si todos devuelven "no providers found", significa que nadie accesible en la red está anunciando ese CID.

## Pinear archivos con Storacha (CLI)

Además de Helia, usamos la CLI de Storacha para pinear archivos y obtener una URL pública estable.

### Requisitos Storacha

- Node 18+ (ya lo tienes si usas Helia aquí).
- CLI instalada globalmente:

```bash
npm install -g @storacha/cli
storacha --help
```

### 1. Login y plan de cuenta

Primero hay que autorizar un agente y asociarlo a una cuenta con plan (por ejemplo Starter):

```bash
storacha login tu-email@example.com
```

Sigue el enlace que te llega por email, elige un plan y espera a que se configure. Luego puedes comprobar el plan:

```bash
storacha plan get
```

### 2. Crear y usar un Space

Todo lo que subas se asocia a un **Space**. Un space es como un "bucket" identificado por un DID:

```bash
storacha space create Documents
storacha space ls
```

La salida se verá algo como:

```text
* did:key:z6Mk... Documents
```

El `*` indica cuál es el space activo.

Si hace falta, puedes provisionar el space (asociarlo a tu cuenta/plan):

```bash
storacha space provision Documents
```

### 3. Subir (pinear) tu archivo

Desde la carpeta del proyecto (o cualquier otra):

```bash
cd /Users/faustosaludas/Downloads/helia

storacha up ./ejemplo.txt
```

Ejemplo de salida real:

```text
🐔 Agent was authorized by did:mailto:gmail.com:fausaludas14
🐔 did:web:starter.web3.storage
✨ Billing account is set
   1 file 0.1KB
🐔 Stored 1 file
🐔 https://storacha.link/ipfs/bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy
```

Aquí:

- El **CID** es `bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy`.
- La URL `https://storacha.link/ipfs/<CID>` te lleva al contenido en el gateway de Storacha.
- Muchas veces tendrás también URLs de tipo subdominio, por ejemplo:

   - `https://bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy.ipfs.w3s.link/`
   - `https://bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy.ipfs.w3s.link/ejemplo.txt`

   Ambas apuntan al mismo CID, pero:

   - la URL sin `/ejemplo.txt` apunta a la **raíz del DAG/directorio** asociado al CID;
   - la URL con `/ejemplo.txt` apunta directamente al **archivo** dentro de ese directorio.

También puedes usar otros gateways IPFS, por ejemplo:

```text
https://ipfs.io/ipfs/bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy/ejemplo.txt
```

### 4. Verificar el CID pineado con Helia

Puedes usar Helia para leer el mismo CID que pineó Storacha:

```bash
cd /Users/faustosaludas/Downloads/helia

node - <<'EOF'
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'

const cidStr = 'bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy'

const helia = await createHelia()
const fsUnix = unixfs(helia)

const chunks = []
for await (const chunk of fsUnix.cat(cidStr)) {
   chunks.push(chunk)
}

const content = Buffer.concat(chunks).toString()
console.log('Contenido leído con Helia:\n', content)

await helia.stop()
EOF
```

Deberías ver el contenido original de `ejemplo.txt`.

## Notas finales

- Este proyecto está pensado como un ejemplo mínimo para entender cómo se conectan Helia (IPFS) y Storacha (pinning).
- Para producción, considera:
  - Manejar credenciales y spaces de Storacha de forma segura.
  - Añadir registros persistentes (por ejemplo, una DB) para no perder el mapping entre `cid`, `filename`, `spaceDid`, etc.
  - Mejorar la configuración de red/libp2p de Helia si lo vas a usar como nodo de larga duración.
