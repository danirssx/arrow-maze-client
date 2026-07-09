# EAS + iPhone Quickstart

Esta guia resume como usar el proyecto EAS ya registrado para Arrow Maze Client,
que falta configurar y como sincronizar cambios recientes.

## Estado actual

- EAS CLI instalado: `/opt/homebrew/bin/eas`
- Proyecto EAS: `@danielross5018/arrow-maze-client`
- Project ID: `ede51ce4-43d7-47ff-9444-da77c2bc7f6d`
- Config local versionada:
  - `eas.json`
  - `app.json` con `owner` y `extra.eas.projectId`
- PR con el vinculo final: `https://github.com/danirssx/arrow-maze-client/pull/85`

Comprueba que todo esta conectado:

```bash
cd /Users/danirssx/Documents/code/arrow-maze/arrow-maze-client
eas whoami
eas project:info
```

Si `eas whoami` dice que no hay sesion:

```bash
eas login --browser
```

## Sincronizar los ultimos cambios

Cuando el PR #85 ya este mergeado, sincroniza `develop` asi:

```bash
cd /Users/danirssx/Documents/code/arrow-maze/arrow-maze-client
git fetch origin
git checkout develop
git pull --ff-only origin develop
npm ci
npm run verify
```

Si necesitas probar el cambio antes de que el PR #85 se mergee:

```bash
cd /Users/danirssx/Documents/code/arrow-maze/arrow-maze-client
git fetch origin chore/mobile-eas-build-MAZ-213
git checkout chore/mobile-eas-build-MAZ-213
git pull --ff-only origin chore/mobile-eas-build-MAZ-213
npm ci
npm run verify
```

Si tienes cambios locales sin commit y Git no te deja cambiar de rama:

```bash
git status
git stash push -m "local work before syncing EAS"
```

Luego sincronizas y, si necesitas recuperar esos cambios:

```bash
git stash pop
```

## Configurar variables de entorno en EAS

Falta crear `EXPO_PUBLIC_API_BASE_URL` en los entornos de EAS. Esta variable se
inyecta en los builds cloud porque `.env` local no sube a EAS.

Usa URLs reales segun tu backend:

```bash
eas env:create --environment development --name EXPO_PUBLIC_API_BASE_URL --value http://TU_IP_LAN:3000 --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_API_BASE_URL --value https://TU_BACKEND_PREVIEW --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value https://TU_BACKEND_PRODUCTION --visibility plaintext
```

Notas:

- `EXPO_PUBLIC_*` queda embebida en la app, asi que no metas secretos ahi.
- Para probar en iPhone con backend local, usa la IP LAN de tu Mac, no
  `localhost`. Ejemplo: `http://192.168.1.50:3000`.
- El backend debe permitir CORS/origenes si aplica para web; en nativo el punto
  critico es que el iPhone pueda alcanzar esa URL.

Puedes revisar variables desde el dashboard:

```txt
https://expo.dev/accounts/danielross5018/projects/arrow-maze-client
```

## Uso rapido en iPhone con Expo Go

Este es el flujo mas rapido para desarrollo diario.

1. Sincroniza cambios y dependencias:

```bash
git checkout develop
git pull --ff-only origin develop
npm ci
```

2. Configura `.env` local:

```bash
cp .env.example .env
```

Edita `.env`:

```txt
EXPO_PUBLIC_API_BASE_URL=http://TU_IP_LAN:3000
```

3. Arranca Expo:

```bash
npm run start
```

4. En el iPhone:

- Instala Expo Go desde App Store.
- Conecta el iPhone a la misma red Wi-Fi que tu Mac.
- Escanea el QR de Expo.

Cuando cambies JS/TS/UI, Metro normalmente refresca la app. Si no refresca:
abre el menu de Expo Go y usa Reload.

## Uso en iPhone con build instalado

Usa este flujo cuando quieras instalar una app real en tu iPhone sin depender de
Expo Go.

### 1. Registrar el iPhone para builds internos

Para iOS interno/ad hoc necesitas Apple Developer pagado y registrar el UDID del
iPhone:

```bash
eas device:create
```

Abre el link/QR que te da EAS desde el iPhone y completa el registro del
dispositivo.

Puedes listar dispositivos registrados:

```bash
eas device:list
```

### 2. Crear build preview para iPhone

```bash
eas build --profile preview --platform ios
```

Durante el primer build, EAS puede pedir configurar credenciales de Apple. Usa
la cuenta Apple Developer del equipo y deja que EAS gestione certificados y
profiles si el equipo esta de acuerdo.

Cuando termine, EAS entrega un link. Abre ese link en el iPhone e instala la
app.

### 3. Sincronizar cambios en una build instalada

Este proyecto todavia no tiene EAS Update configurado. Eso significa:

- Cambios JS/TS/UI no llegan automaticamente a una build ya instalada.
- Para probar cambios nuevos en la app instalada, debes crear otro build:

```bash
git pull --ff-only origin develop
npm ci
npm run verify
eas build --profile preview --platform ios
```

Abres el nuevo link de EAS en el iPhone e instalas la version nueva.

## Que perfil usar

| Caso | Comando | Donde se usa |
| --- | --- | --- |
| Desarrollo rapido con Expo Go | `npm run start` | iPhone con Expo Go |
| iPhone instalado para pruebas internas | `eas build --profile preview --platform ios` | iPhone fisico registrado |
| Simulador iOS | `eas build --profile development --platform ios` | iOS Simulator en Mac |
| Android interno | `eas build --profile preview --platform android` | APK instalable |
| Produccion | `eas build --profile production --platform ios` | Solo desde `main` con aprobacion humana |

Importante: el perfil `development` actual de iOS esta configurado para
simulador (`ios.simulator: true`). Para iPhone fisico usa `preview`, o crea un
perfil nuevo si el equipo decide tener development builds instalables en device.

## Checklist antes de un build real para iPhone

- [ ] PR #85 mergeado en `develop`.
- [ ] Repo local sincronizado con `git pull --ff-only origin develop`.
- [ ] `npm ci` ejecutado.
- [ ] `npm run verify` verde.
- [ ] `eas whoami` muestra la cuenta correcta.
- [ ] `eas project:info` muestra `@danielross5018/arrow-maze-client`.
- [ ] `EXPO_PUBLIC_API_BASE_URL` existe en el entorno EAS que vas a usar.
- [ ] El backend configurado es accesible desde el iPhone.
- [ ] Para iOS preview: iPhone registrado con `eas device:create`.
- [ ] Para iOS preview/production: credenciales Apple configuradas.

## Referencias

- EAS internal distribution: https://docs.expo.dev/build/internal-distribution/
- EAS environment variables: https://docs.expo.dev/eas/environment-variables/
- EAS first build setup: https://docs.expo.dev/build/setup/
