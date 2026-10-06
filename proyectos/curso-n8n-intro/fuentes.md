# Fuentes — curso «Introducción a n8n» (público no técnico)

Investigación hecha **solo con fuentes oficiales**: n8n.io, docs.n8n.io, learn.n8n.io, api.n8n.io (API pública
de la galería de plantillas), github.com/n8n-io, community.n8n.io; y, para la comparación, zapier.com y make.com
(lo que cada empresa dice de sí misma). Fecha de consulta de todo: **2026-10-03**.

Notas de método:
- De docs.n8n.io se leyó la versión Markdown de cada página (misma URL con `.md` al final). Aquí se cita la
  URL HTML, que da 200 y muestra lo mismo.
- n8n.io/pricing, zapier.com/pricing y make.com/en/pricing se comprobaron en un navegador, cambiando entre
  facturación mensual y anual. make.com da 403 a peticiones sin navegador, pero en el navegador abre bien.
- La documentación de n8n se reorganizó (rutas nuevas `/build/…`, `/deploy/…`). Algunas URL antiguas ya no
  existen. Por ejemplo, `docs.n8n.io/sustainable-use-license/` da 404 y `docs.n8n.io/courses/level-one/`
  redirige a learn.n8n.io.
- En el momento de la consulta: versión `stable` 2.41.6 y `beta` 2.42.2. n8n 3.0 está anunciada para
  **octubre de 2026**, así que conviene revisar la terminología antes de grabar.
- Sin datos personales. Se omiten los nombres de fundadores, de los autores de testimonios y de los creadores de
  plantillas.

---

## 1. Qué es n8n

- **Definición oficial (docs):** «n8n is a fair-code licensed workflow automation tool that combines AI features
  with business process automation.» — https://docs.n8n.io/welcome — consultado 2026-10-03
- **Lema de la web:** «AI agents and workflows you can see and control». Debajo dice: «Build visually, go deep
  with code, connect to anything… Deploy on your infrastructure or ours.» — https://n8n.io/ — consultado 2026-10-03
- **Cómo se describe en las páginas de comparación:** «a powerful low-code, source-available and self-hostable AI
  workflow builder», pensado «for technical teams». — https://n8n.io/vs/zapier/ — consultado 2026-10-03
- **Licencia:** n8n usa la **Sustainable Use License** y la **n8n Enterprise License** (esta última para los archivos
  `.ee.`). Las dos siguen el modelo **fair-code**. — https://docs.n8n.io/n8n-community-license/community-license — consultado 2026-10-03
- **Qué permite la Sustainable Use License** (creada por n8n en 2022): usar, modificar y redistribuir gratis, con
  tres límites:
  - uso interno de la empresa o no comercial/personal;
  - distribución solo gratuita y no comercial;
  - no se pueden quitar los avisos de licencia.
  Fuente: https://docs.n8n.io/n8n-community-license/community-license — consultado 2026-10-03
- **¿Es código abierto?** n8n dice que **no**: según la OSI, una licencia de código abierto no puede limitar el
  uso, «so we do not call ourselves open source». El código está disponible («source-available») y n8n acuñó el
  término «fair-code». — https://docs.n8n.io/n8n-community-license/community-license — consultado 2026-10-03
  - Para el curso: decir «código fuente disponible y autoalojable», **no** «open source».
  - La nota de prensa de n8n.io/press aún dice «free and open node-based Workflow Automation Tool». Es un texto
    antiguo y contradice la docs. **Incoherencia en las fuentes oficiales.** — https://n8n.io/press/ — consultado 2026-10-03
- **Licencia anterior:** Apache 2.0 con Commons Clause, hasta el 17 de marzo de 2022. —
  https://docs.n8n.io/n8n-community-license/community-license — consultado 2026-10-03
- **Qué se puede hacer con la licencia Community** (FAQ):
  - Sí: usarlo para tu negocio; para proyectos personales y aprendizaje; cobrar por crear o mantener flujos y por
    formación; usarlo para crear automatizaciones para clientes, siempre que el cliente no pueda editarlas.
  - No: ofrecer n8n como servicio para que tus clientes creen flujos, ni hacer una versión de marca blanca.
  Fuente: https://docs.n8n.io/n8n-community-license/community-license/license-faq — consultado 2026-10-03
- **Autoalojable:** «Deploy with Docker», «Access the entire source code on Github», «Hosted version also
  available». — https://n8n.io/ — consultado 2026-10-03
- **Repositorio:** https://github.com/n8n-io/n8n. La descripción del repositorio dice «Fair-code workflow automation
  platform with native AI capabilities… self-host or cloud, 400+ integrations». — consultado 2026-10-03
- **Estrellas en GitHub:** la web muestra **206,474** (cabecera de n8n.io) y «206.5k stars» / «Top 50 Github» en la
  portada. La API de GitHub devolvía 206.540 en el mismo momento. — https://n8n.io/ y https://n8n.io/pricing/ — consultado 2026-10-03
- **Número de integraciones (la cifra cambia según la página oficial):**
  - Portada: «**over 500 integrations**» — https://n8n.io/ — consultado 2026-10-03
  - Directorio de integraciones: contador «**2285 integrations**». Cuenta disparadores, nodos core, sub-nodos de IA
    y nodos de partners por separado. — https://n8n.io/integrations/ — consultado 2026-10-03
  - Página n8n vs. Zapier: «1000+ integrations». Incluye nodos de partners y nodos «credential-only». —
    https://n8n.io/vs/zapier/ — consultado 2026-10-03
  - Página n8n vs. Make: dice «over 1,000 integrations» y, en otro párrafo, «all 500+ integrations». —
    https://n8n.io/vs/make/ — consultado 2026-10-03
  - Changelog y GitHub: «400+ integrations». — https://docs.n8n.io/changelog/readme y
    https://github.com/n8n-io/n8n — consultado 2026-10-03
  - **Recomendación para el curso:** usar la cifra de la portada («más de 500 integraciones») y no dar una cifra
    exacta. Señalar en el informe que las páginas oficiales no coinciden.
- **Origen:** «n8n is headquartered in Berlin and was founded … in 2019» (nota de prensa) y «since we began in
  2019» (página de empleo). — https://n8n.io/press/ y https://n8n.io/careers/ — consultado 2026-10-03
  - El repositorio de GitHub se creó el 2019-06-22 (dato de la API de GitHub). — consultado 2026-10-03
- **Comunidad (la cifra también varía):**
  - Portada: «200k+ community members». — https://n8n.io/
  - FAQ de precios: «over 170,000 AI and automation enthusiasts…». — https://n8n.io/pricing/
  - Página vs. Make: «40K+ members» (dato antiguo). — https://n8n.io/vs/make/
  - Consultado 2026-10-03

## 2. Formas de usarlo: n8n Cloud o autoalojado

- **Dos opciones:** n8n Cloud (gestionado por n8n) o self-hosted (en tu propia infraestructura). Para quien
  «Don't have technical expertise», la docs recomienda **n8n Cloud**. Para quien quiere usarlo gratis, recomienda
  **Self-hosted (Community edition)**. — https://docs.n8n.io/choose-how-to-use-n8n — consultado 2026-10-03
- **Cómo cobra n8n:** «All plans include unlimited users & workflows and every integration. Pricing based on
  monthly workflow executions, regardless of complexity.» — https://n8n.io/pricing/ — consultado 2026-10-03
- **Qué es una ejecución:** «a single run of your entire workflow. It doesn't matter how many steps are in the
  workflow or how much data it processes.» — https://n8n.io/pricing/ (FAQ) — consultado 2026-10-03
- **Planes de n8n Cloud** (precios en € tal como los muestra n8n.io/pricing, en facturación mensual y anual):

  | Plan | Mensual | Anual (precio por mes) | Ejecuciones/mes | Ejecuciones simultáneas | Proyectos compartidos | Créditos de Assistant/mes |
  |---|---|---|---|---|---|---|
  | **Starter** | 24 € | 20 € | 2.5k | 5 | 1 | 1,600 |
  | **Pro** | 60 € | 50 € | 10k (tiene selector de volumen) | hasta 50 («20 / 50» en la tabla) | 3 | hasta 9,600 |
  | **Business** (*self-hosted only*) | 800 € | 667 € | 40k | hasta 50 | 6 | Assistant (preview) |
  | **Enterprise** (Cloud o self-hosted) | Contact Sales | — | a medida | 200+ | ilimitados | a petición |

  Fuente: https://n8n.io/pricing/ — consultado 2026-10-03
  - El descuento anual se anuncia como «Annually (Save 17%)».
  - Las tarjetas de Starter y Pro dicen «Start free trial — No credit card required».
  - Business **aún no está disponible en Cloud**: «Not yet. The Business plan is currently only available for
    self-hosted n8n.» (FAQ).
  - [NO VERIFICADO] Precios del Pro con más de 10k ejecuciones. Los datos internos de la página incluyen un tramo
    de 50k (145 €/mes en mensual). No se pudo comprobar en la interfaz porque el selector no se abrió.
- **Otros límites de la tabla comparativa** (Starter / Pro / Enterprise) — https://n8n.io/pricing/ — consultado 2026-10-03
  - Workflows activos: «Unlimited» en los tres.
  - Ejecuciones guardadas: 2.5k / 25k / 50k.
  - Retención del registro de ejecuciones: 7 días / 30 días / ilimitada.
  - Duración máxima de una ejecución: 5 min / 40 min / 40 min.
  - Historial de versiones del workflow: 1 / 5 / 365+ días.
  - Error workflows y Execution logging: incluidos en todos los planes.
  - Soporte: Starter y Pro tienen foro (más soporte por email para temas de cuenta y facturación); Enterprise
    tiene soporte dedicado con SLA.
- **Prueba gratuita de Cloud:** **14 días** con funciones del plan **Pro**.
  - Límites: 1,000 ejecuciones, 5 ejecuciones simultáneas, 180 segundos máximos por ejecución, 1 proyecto de
    equipo, 800 créditos de Assistant y 100 de IA.
  - Sin tarjeta de crédito, salvo en la prueba del plan Business.
  - Fuentes: https://n8n.io/pricing/ (FAQ «What's included in the n8n free trial?») y
    https://docs.n8n.io/deploy/use-n8n-cloud/start-your-free-trial — consultado 2026-10-03
  - [Incoherencia menor] La docs habla de «a limit of 1000 executions and the same computing power as the Starter
    plan». La web de precios añade el límite de 180 s.
- **Al terminar la prueba:** si no se contrata un plan, «the trial automatically expires and n8n deletes your
  workspace». Los flujos se pueden descargar durante 90 días después. —
  https://docs.n8n.io/deploy/use-n8n-cloud/start-your-free-trial — consultado 2026-10-03
- **Datos en Cloud:** «stored within the EU, on servers located in Frankfurt, Germany». — https://n8n.io/pricing/
  (FAQ) — consultado 2026-10-03
- **Autoalojado: ediciones gratuitas**
  - **Community**: gratis, «almost the complete feature set».
  - **Registered Community**: gratis registrando un email. Añade carpetas, *debug in editor* y datos de ejecución
    personalizados.
  - **Business** y **Enterprise**: de pago, con clave de licencia.
  - La Community **no** incluye, entre otras cosas: proyectos, SSO, compartir workflows y credenciales, entornos,
    Git, secretos externos, log streaming.
  - Fuentes: https://docs.n8n.io/deploy/host-n8n/community-edition-features y
    https://docs.n8n.io/choose-how-to-use-n8n — consultado 2026-10-03
- **Community Edition en la web de precios:** «A standard, self-hosted version of n8n is available on GitHub.» —
  https://n8n.io/pricing/ — consultado 2026-10-03
- **Cambio en n8n 3.0 (octubre de 2026):** el autoalojado exigirá Docker; dejarán de funcionar las instalaciones
  con `npm` o `npx n8n`. La docs propone instalar con «one-line setup»
  (`curl -fsSL https://get.n8n.io | sh`) o con Docker Compose. —
  https://docs.n8n.io/changelog/v30-breaking-changes y https://docs.n8n.io/build-your-first-workflow — consultado 2026-10-03

## 3. Conceptos básicos (con los términos en inglés de la interfaz)

### Workflow, nodo, canvas
- **workflow:** «An n8n workflow is a collection of nodes that automate a process. Workflows begin execution when a
  trigger condition occurs and execute sequentially…» — https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- **node:** «nodes are individual components that you compose to create workflows. Nodes define when the workflow
  should run, allow you to fetch, send, and process data, can define flow control logic, and connect with external
  services.» — https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- **canvas:** «the main interface for building workflows in n8n's editor UI». —
  https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- **Interfaz para empezar:** botón **Add first step** para añadir el disparador; conector **Add node** para añadir
  los siguientes pasos. El menú de cada nodo incluye **Rename node**, **Pin node**, **Duplicate node**,
  **Deactivate node**, etc. — https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes — consultado 2026-10-03

### Disparadores (trigger nodes) y acciones
- **trigger node:** «a special node responsible for executing the workflow in response to certain conditions. All
  production workflows need at least one trigger». — https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- **Triggers frente a Actions:** cada nodo ofrece operaciones de dos tipos.
  - Triggers: arrancan el flujo. En el buscador de nodos aparecen con un **icono de rayo**.
  - Actions: tareas concretas dentro del flujo.
  - Fuente: https://docs.n8n.io/integrations/builtin/node-types — consultado 2026-10-03
- **Core nodes:** «provide functionality such as logic, scheduling, or generic API calls». Se distinguen de los
  nodos de aplicaciones concretas. — https://docs.n8n.io/integrations/builtin/node-types — consultado 2026-10-03
- **Manual Trigger:**
  - En el canvas aparece con el nombre **«When clicking ‘Execute workflow’»** (nombre por defecto en el código del
    nodo: https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/ManualTrigger/ManualTrigger.node.ts).
  - La docs dice: úsalo «if you want to start a workflow by selecting **Execute Workflow**», para probar antes de
    poner un disparador automático.
  - Fuente: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualworkflowtrigger — consultado 2026-10-03
  - El texto antiguo «When clicking ‘Test workflow’» ya no aparece; ahora pone «Execute workflow».
- **Schedule Trigger:** «run workflows at fixed intervals and times», parecido a Cron. Hay que publicar el flujo
  para que se ejecute. — https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger — consultado 2026-10-03
- **Webhook:** recibe datos de otras apps cuando ocurre algo. Sirve para servicios que no tienen un nodo
  disparador propio. — https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook — consultado 2026-10-03
- **n8n Form Trigger:**
  - En el canvas aparece como **«On form submission»** (nombre por defecto en el código:
    https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Form/v2/FormTriggerV2.node.ts).
  - Arranca el flujo cuando alguien envía el formulario. «The node generates the form web page for you».
  - Con el nodo **n8n Form** se pueden añadir más páginas al formulario.
  - Fuente: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.formtrigger — consultado 2026-10-03
- **Gmail Trigger:** «can start a workflow based on events in Gmail». —
  https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.gmailtrigger — consultado 2026-10-03
- **Chat Trigger:** para chatbots. Cada mensaje cuenta como una ejecución: «one conversation where a user sends 10
  messages uses 10 executions». — https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger — consultado 2026-10-03

### Nodos core más usados (nombre en la interfaz y qué hacen según la docs)
- **If:** «split a workflow conditionally based on comparison operations». —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if — consultado 2026-10-03
- **Switch:** como If, pero «supports multiple output routes». —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch — consultado 2026-10-03
- **Edit Fields (Set):** «set workflow data… can set new data as well as overwrite data that already exists».
  Útil antes de escribir en Google Sheets o en una base de datos. —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set — consultado 2026-10-03
- **Code:** «run your own JavaScript or Python inside a workflow». —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code — consultado 2026-10-03
- **HTTP Request:** «one of the most versatile nodes… query data from any app or service with a REST API». —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest — consultado 2026-10-03
- **Merge:** «combine data from multiple streams, once data of all streams is available». —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge — consultado 2026-10-03
- **Filter:** deja pasar los items que cumplen la condición y descarta los demás. —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.filter — consultado 2026-10-03
- **Wait:** «pause your workflow's execution» hasta que se cumpla una condición (por ejemplo, **After Time
  Interval**). — https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait — consultado 2026-10-03

### Datos entre nodos (items y JSON)
- «In n8n, all data passed between nodes is an array of objects». Cada elemento es un **item**, con su contenido
  bajo la clave `json` (o `binary` para archivos). —
  https://docs.n8n.io/build/work-with-data/understand-n8ns-data-structure — consultado 2026-10-03
- «Nodes process multiple items automatically». Ejemplo: con dos items de entrada, el nodo crea dos tarjetas. —
  misma URL — consultado 2026-10-03
- **Arrastrar y soltar:** si arrastras un campo desde el panel **INPUT** a un parámetro, n8n crea la expresión
  `{{ $json.fruit }}`. — misma URL — consultado 2026-10-03
- La interfaz muestra los datos en tablas. Los campos anidados aparecen en negrita. — misma URL — consultado 2026-10-03

### Expresiones (`{{ }}`)
- **expression:** «allow you to populate node parameters dynamically by executing JavaScript code… using data from
  previous nodes». — https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- **Ejemplos de la docs:**
  - `{{ $today.minus(7, 'days') }}`, en la pestaña **Expression** del parámetro
    (https://docs.n8n.io/build-your-first-workflow).
  - `{{$json.body.city}}`
    (https://docs.n8n.io/build/work-with-data/transform-data/expressions-for-data-transformation).
  - Consultado 2026-10-03
- **Buena práctica oficial:** para transformar datos, mejor usar **Edit Fields (Set)** que repartir expresiones
  complejas por muchos nodos. —
  https://docs.n8n.io/build/work-with-data/transform-data/expressions-for-data-transformation — consultado 2026-10-03

### Credenciales (credentials)
- «credentials store authentication information to connect with specific apps and services» (usuario y
  contraseña, API key, OAuth…). — https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- Se crean con **Create > Credential** o desde el desplegable del propio nodo (**Create new credential**). Al
  guardarlas, «n8n tests it to confirm it works». —
  https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials — consultado 2026-10-03
- Se guardan **cifradas** en la base de datos. —
  https://docs.n8n.io/integrations/builtin/node-types — consultado 2026-10-03
- **Novedad en Cloud: Gateway credits.** Permiten usar modelos y servicios de IA compatibles sin crear credencial:
  basta elegir **Use Gateway credits** en el nodo. Es un saldo prepago. —
  https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials y https://docs.n8n.io/changelog/readme
  (2026-09-02, n8n 2.36) — consultado 2026-10-03

### Ejecuciones (executions)
- Una ejecución es una pasada completa del workflow. —
  https://docs.n8n.io/build/understand-workflows/understand-executions — consultado 2026-10-03
- **Ejecuciones manuales:**
  - Botón **Execute workflow** para el flujo entero.
  - Botón **Execute step** para un solo nodo (ejecución parcial).
  - Sirven para probar.
  - Fuente: https://docs.n8n.io/build/understand-workflows/understand-executions/types-of-executions — consultado 2026-10-03
- **Ejecuciones de producción:** las lanza el disparador cuando el workflow está publicado. Se consultan en la
  pestaña **Executions** del workflow, no en el editor. En los planes de pago cuentan para la cuota. — misma URL —
  consultado 2026-10-03
- **Lista de todas las ejecuciones:** página **Overview** > pestaña **Executions**. Se puede filtrar por estado:
  **Failed**, **Running**, **Success** o **Waiting**. —
  https://docs.n8n.io/build/understand-workflows/understand-executions/view-all-executions — consultado 2026-10-03

### Activar un workflow: ahora se dice **Publish** (antes era el interruptor «Active»)
- En la interfaz actual ya no hay interruptor «Active». Hay un botón **Publish** en la cabecera del canvas
  (atajo `Shift`+`p`).
- «n8n auto saves your workflow while you're editing. When you're ready to put the workflow into production,
  publish your workflow.» Los cambios quedan en borrador hasta que publicas.
- Al publicar, los Webhook y Form triggers pasan a usar su URL de producción, los Schedule empiezan a ejecutarse
  y los eventos de las apps disparan el flujo.
- Para despublicar: desplegable junto a **Publish** (`Cmd/Ctrl`+`u`), desde la lista de workflows o desde el
  historial de versiones.
- Fuente: https://docs.n8n.io/build/understand-workflows/save-and-publish-workflows — consultado 2026-10-03
- «All new workflows are unpublished by default». —
  https://docs.n8n.io/build/understand-workflows/create-and-run-workflows — consultado 2026-10-03

### Prueba frente a producción (Test URL / Production URL)
- El nodo Webhook tiene dos URL, **Test URL** y **Production URL**.
  - La de prueba se activa con **Listen for test event** o **Execute workflow**, y los datos se ven en el editor.
  - La de producción se registra al **publicar**. Sus datos no se ven en el editor, sino en la pestaña
    **Executions**.
  - Fuente: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook — consultado 2026-10-03
- El n8n Form Trigger funciona igual. Mientras construyes, usas la **Test URL**. Cuando el flujo está listo,
  cambias a la **Production URL** y publicas. —
  https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.formtrigger — consultado 2026-10-03

### Gestión de errores: Error workflow y Error Trigger
- Cada workflow puede tener un **error workflow**. Se configura en **Options > Settings > Error workflow** y se
  ejecuta cuando una ejecución falla, por ejemplo para avisar por email o Slack.
- El error workflow empieza con el nodo **Error Trigger**.
- Un mismo error workflow puede servir a varios workflows.
- Fuente: https://docs.n8n.io/build/flow-logic/handle-errors-gracefully — consultado 2026-10-03
- El Error Trigger no se puede probar con una ejecución manual; solo salta cuando falla una ejecución
  automática. — https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger — consultado 2026-10-03
- Desde n8n 2.38 (2026-09-01), las ejecuciones de los error workflows **ya no cuentan** para la cuota, en
  cualquier plan. — https://docs.n8n.io/changelog/readme — consultado 2026-10-03
- El nodo **Stop And Error** sirve para forzar un fallo y que se dispare el error workflow. —
  https://docs.n8n.io/build/flow-logic/handle-errors-gracefully — consultado 2026-10-03
- En los ajustes de cada nodo hay **Retry On Fail** y **On Error** (Stop Workflow / Continue / Continue (using
  error output)). — https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes — consultado 2026-10-03

### Datos fijados (pinned data)
- «Data pinning allows you to temporarily freeze the output data of a node during workflow development… Production
  workflows ignore pinned data». — https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- Cómo se fija: ejecuta el nodo y pulsa **Pin data** en el panel **OUTPUT**. Aparece el aviso «This data is
  pinned». Los datos fijados se pueden editar o quitar con **Unpin**. —
  https://docs.n8n.io/build/work-with-data/pin-and-mock-data — consultado 2026-10-03

### Notas adhesivas (sticky notes)
- «Sticky notes let you annotate and comment on your workflows».
  - Para añadir una, busca «note» en el panel de nodos y elige **Sticky Note**.
  - Admiten Markdown y 7 colores predefinidos o uno personalizado.
  - Se pueden colocar detrás de varios nodos para agruparlos visualmente.
  - Fuente: https://docs.n8n.io/build/understand-workflows/workflow-components/add-notes-and-documentation — consultado 2026-10-03

## 4. Funciones de IA de n8n

- **Integrate AI:** n8n permite crear flujos de IA con proveedores como OpenAI, Anthropic o Google, añadir
  herramientas y memoria, y combinar varios modelos. — https://docs.n8n.io/build/integrate-ai — consultado 2026-10-03
- **AI Agent node:**
  - «Connect a chat model and one or more tools, and the agent decides which tools to call to complete a task».
  - Hay que conectar **al menos una herramienta** (tool sub-node).
  - Desde la 1.82.0 todos los AI Agent funcionan como «Tools Agent».
  - Fuente: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent — consultado 2026-10-03
- **Cluster nodes:**
  - Son grupos de nodos: un **root node** más uno o varios **sub-nodes** que amplían lo que hace.
  - Los nodos de IA implementan LangChain (JavaScript).
  - Root nodes: los Chain (Basic LLM Chain, Summarization Chain…) y AI Agent.
  - Sub-nodes: Chat Models (OpenAI Chat Model, Anthropic Chat Model, Ollama Chat Model…), Memory (Simple Memory,
    Postgres Chat Memory…), Tools (Call n8n Workflow Tool, Wikipedia…), Output Parsers, Embeddings…
  - Fuentes: https://docs.n8n.io/build/integrate-ai/langchain-in-n8n y https://docs.n8n.io/key-concept-glossary —
    consultado 2026-10-03
- **Memoria:** «Memory sub-nodes only attach to the AI Agent root node». Las chains no tienen memoria. —
  https://docs.n8n.io/build/integrate-ai/langchain-in-n8n — consultado 2026-10-03
- **Herramientas (tool):** «an add-on resource that the AI can refer to… to interact with external systems or
  complete specific, focused tasks». El nodo HTTP Request también puede servir de herramienta para un agente. —
  https://docs.n8n.io/key-concept-glossary y https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest — consultado 2026-10-03
- **Chat Trigger:**
  - Hay que conectarlo a un agente o a una chain.
  - Modos: **Hosted Chat** (la interfaz de chat de n8n) o **Embedded Chat** (tu propia interfaz).
  - Fuente: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger — consultado 2026-10-03
- **Asistentes de IA dentro del editor:**
  - **n8n Assistant** (en *Preview*):
    - Es un agente de chat que «create, edit, test, and troubleshoot workflows from natural language». También
      ayuda con las credenciales «without pasting secrets into chat».
    - Disponible en **n8n Cloud Starter y Pro** y en **autoalojado Community, Registered Community y Business**
      (en autoalojado pones tu propia API key).
    - **Aún no está en Enterprise**, salvo preview bajo petición.
    - Fuentes: https://docs.n8n.io/build/ways-of-building-workflows/n8n-assistant y https://n8n.io/pricing/ —
      consultado 2026-10-03
    - Se paga con créditos de Assistant: 1,600/mes en Starter; 4,000 o 9,600/mes en Pro según tamaño; 800 en la
      prueba gratuita. Los créditos no usados no pasan al mes siguiente. — https://n8n.io/pricing/ (FAQ) y
      https://docs.n8n.io/deploy/use-n8n-cloud/assistant-credits — consultado 2026-10-03
  - **AI Workflow Builder:** según el changelog, «**n8n Assistant supersedes the AI Workflow Builder**» desde n8n
    2.29.9 (2026-07-09). La página de la docs sigue publicada, pero la web de precios ya no lo nombra. —
    https://docs.n8n.io/changelog/readme y https://docs.n8n.io/build/ways-of-building-workflows/ai-workflow-builder — consultado 2026-10-03
  - **Ask n8n AI:** el asistente de ayuda anterior. «is no longer actively developed». —
    https://docs.n8n.io/build/ways-of-building-workflows/use-the-ai-assistant — consultado 2026-10-03
- **Agents (nuevo, en *Preview*):**
  - Agentes que se crean en la pestaña **Agents** (**Create Agent**), aparte de los workflows. Tienen modelo,
    instrucciones, herramientas, skills, memoria y canales (Slack, Telegram…).
  - Una interacción con un agente cuenta como una ejecución.
  - Disponibles en todos los planes de Cloud desde n8n 2.40 (2026-09-21).
  - «The AI Agent node hasn't changed».
  - Fuentes: https://docs.n8n.io/changelog/readme y https://docs.n8n.io/build/build-and-manage-agents — consultado 2026-10-03
  - Para un curso de nivel inicial basta con mencionarlos: son nuevos y están en Preview.

## 5. Plantillas (galería oficial n8n.io/workflows)

- **Cuántas plantillas anuncian (también varía):**
  - Menú de la web: «Explore **+10k** workflow automation templates». — https://n8n.io/
  - Contador de la galería: «**12895** Workflow Automation Templates». — https://n8n.io/workflows/
  - API pública de plantillas: `totalWorkflows` 12918. — https://api.n8n.io/api/templates/search
  - Consultado 2026-10-03
  - **Recomendación:** decir «más de 10.000 plantillas».
- **Plantillas del propio n8n:** el perfil oficial «n8n Team» («Meet the official n8n team») tiene **90 Workflow
  Templates**. El resto las publican creadores de la comunidad; algunos están marcados como verificados. —
  https://n8n.io/creators/n8n-team/ — consultado 2026-10-03
- **Cómo usarlas en la interfaz:** el botón **Templates** lleva a la galería. «you may need to fill in credentials
  and adjust the configuration». — https://docs.n8n.io/build/ways-of-building-workflows/use-templates y
  https://docs.n8n.io/key-concept-glossary — consultado 2026-10-03
- **Plantillas para los casos del curso** (título exacto, URL comprobada con 200 y contenido revisado en la API
  oficial; todas gratuitas):
  - **(a) Formulario → Google Sheets → aviso**
    - «Manage contact form submissions with Google Sheets, Slack alerts & Gmail replies».
      Nodos: n8n Form Trigger, Google Sheets, Slack, Gmail. Creador verificado de la comunidad.
      https://n8n.io/workflows/11643-manage-contact-form-submissions-with-google-sheets-slack-alerts-and-gmail-replies/ — consultado 2026-10-03
    - Alternativa: «Streamline data from an n8n form into Google Sheet, Airtable and Email Sending».
      Nodos: Form Trigger, Google Sheets, Airtable, Gmail. Creador verificado.
      https://n8n.io/workflows/2087-streamline-data-from-an-n8n-form-into-google-sheet-airtable-and-email-sending/ — consultado 2026-10-03
  - **(b) Leads de un formulario a un CRM**
    - «Automatically email great leads when they submit a form and record in HubSpot».
      Nodos: Form Trigger, HubSpot, Gmail, If… Creador verificado. Necesita además cuentas de Hunter y MadKudu.
      https://n8n.io/workflows/2122-automatically-email-great-leads-when-they-submit-a-form-and-record-in-hubspot/ — consultado 2026-10-03
    - Alternativa más sencilla: «Capture form leads in HubSpot and send Slack notifications».
      Nodos: Webhook, HubSpot, Slack. Creador verificado.
      https://n8n.io/workflows/17339-capture-form-leads-in-hubspot-and-send-slack-notifications/ — consultado 2026-10-03
  - **(c) Clasificar correos entrantes con IA**
    - «Auto-label incoming Gmail messages with AI nodes».
      Nodos: Gmail Trigger, Basic LLM Chain, OpenAI Chat Model, Gmail. Etiquetas de ejemplo: Partnership, Inquiry,
      Notification. Creador verificado.
      https://n8n.io/workflows/2197-auto-label-incoming-gmail-messages-with-ai-nodes/ — consultado 2026-10-03
    - Del propio n8n: «Suggest meeting slots using AI».
      https://n8n.io/workflows/1953-suggest-meeting-slots-using-ai/ — consultado 2026-10-03
  - **(d) Informe o resumen programado**
    - Del propio n8n: «Report number of weekly created records in an app».
      Nodos: Schedule Trigger, Notion, Filter, Slack.
      https://n8n.io/workflows/1931-report-number-of-weekly-created-records-in-an-app/ — consultado 2026-10-03
    - Con IA: «Summarise Slack channel activity for weekly reports with AI».
      Nodos: Schedule Trigger, Slack, Gemini. Creador verificado.
      https://n8n.io/workflows/3969-summarise-slack-channel-activity-for-weekly-reports-with-ai/ — consultado 2026-10-03
  - **(e) Atención al cliente o redes sociales**
    - Del propio n8n: «Slack chatbot powered by AI».
      https://n8n.io/workflows/1961-slack-chatbot-powered-by-ai/ — consultado 2026-10-03
    - Del propio n8n: «Telegram AI bot with LangChain nodes».
      https://n8n.io/workflows/2035-telegram-ai-bot-with-langchain-nodes/ — consultado 2026-10-03
    - Redes sociales: «AI-generated LinkedIn posts with OpenAI, Google Sheets & email approval workflow».
      Nodos: Schedule, Google Sheets, OpenAI, Gmail (aprobación), LinkedIn. Creador verificado.
      https://n8n.io/workflows/4005-ai-generated-linkedin-posts-with-openai-google-sheets-and-email-approval-workflow/ — consultado 2026-10-03
  - **Agente de IA de ejemplo** (el que enlaza la propia docs): «AI agent chat», del n8n Team.
    https://n8n.io/workflows/1954-ai-agent-chat/ — consultado 2026-10-03

## 6. Integraciones comprobadas en n8n.io/integrations

Todas las páginas dan 200 y tienen su ficha en la docs:

| Integración | Página en n8n.io | Docs del nodo |
|---|---|---|
| Google Sheets | https://n8n.io/integrations/google-sheets/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets |
| Gmail (+ Gmail Trigger) | https://n8n.io/integrations/gmail/ · https://n8n.io/integrations/gmail-trigger/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail |
| Slack | https://n8n.io/integrations/slack/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack |
| HubSpot | https://n8n.io/integrations/hubspot/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.hubspot |
| Notion | https://n8n.io/integrations/notion/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.notion |
| Airtable | https://n8n.io/integrations/airtable/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable |
| Telegram | https://n8n.io/integrations/telegram/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram |
| OpenAI | https://n8n.io/integrations/openai/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai |
| Microsoft Outlook | https://n8n.io/integrations/microsoft-outlook/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftoutlook |
| Microsoft Teams | https://n8n.io/integrations/microsoft-teams/ | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftteams |

Consultado 2026-10-03. Otros datos del directorio:
- Ordenado por «Popularity», el primer resultado es Google Sheets. Le siguen AI Agent, HTTP Request, Gmail, OpenAI,
  Slack y Telegram. — https://n8n.io/integrations/ — consultado 2026-10-03
- También tienen página propia **n8n Form Trigger** (https://n8n.io/integrations/n8n-form-trigger/) y **AI Agent**
  (https://n8n.io/integrations/agent/). — consultado 2026-10-03

## 7. n8n frente a Zapier y Make: qué dice cada empresa

**Lo que dice n8n** (páginas comparativas de la propia n8n; son material comercial suyo):
- n8n cobra «per full workflow execution, no limit on the number of workflows/tasks/steps». Zapier, en cambio,
  cobra «for each task that your workflow includes». — https://n8n.io/vs/zapier/ — consultado 2026-10-03
- n8n se presenta así: autoalojable con Community Edition gratuita; usuarios ilimitados en todos los planes;
  webhooks en todos los planes; código en JavaScript o Python. De Zapier dice que es «Cloud-Only». —
  https://n8n.io/vs/zapier/ — consultado 2026-10-03
- Según n8n, Zapier es una herramienta no-code «excellent choice for non-technical users looking to automate simple
  tasks», con menos flexibilidad para lógica compleja. — https://n8n.io/vs/zapier/ — consultado 2026-10-03
  - Útil para el curso: es la propia n8n quien reconoce la ventaja de Zapier en sencillez.
- Make, según n8n, cobra «for each individual operation» y tiene un límite de transferencia de datos ligado a las
  operaciones. Dice también que desde el 27 de agosto de 2025 Make pasó de «Operations» a «Credits». De Make dice
  que es «Cloud-Only» (con agente on-prem en Enterprise). — https://n8n.io/vs/make/ — consultado 2026-10-03
- Cifras de n8n sobre la competencia que no coinciden con lo que dicen Zapier y Make hoy:
  - Para Zapier, n8n da «8,000+» integraciones; zapier.com dice «9,000+ apps».
  - Para Make, n8n da «2,800+»; make.com dice «3000+ apps».
  - Usar en el curso las cifras de cada empresa.
- Índice de todas las comparativas oficiales de n8n: https://n8n.io/vs/ — consultado 2026-10-03

**Lo que dice Zapier de sí misma** — https://zapier.com/pricing — consultado 2026-10-03
- Modelo por **tareas**: «When Zapier performs an action successfully, it counts as a task. Each successful action
  in a Zap counts as a separate task.» Comprobar si hay datos nuevos no consume tareas.
- Las tareas se comparten en toda la cuenta: «Zap workflows, AI steps, code, MCP, and SDK all draw from the same
  task allocation».
- Planes, en USD:
  - **Free**: $0, 100 tareas/mes, Zaps de dos pasos.
  - **Professional**: «Starting from» $19.99/mes en anual o $29.99/mes en mensual. Incluye Zaps de varios pasos y
    webhooks.
  - **Team**: «Starting from» $69/mes en anual o $103.50/mes en mensual, 25 usuarios.
  - **Enterprise**: «Contact for pricing».
  - Descuento anual: «Pay yearly (Save 33%)».
- «9,000+ apps». Prueba gratuita de 14 días de las funciones premium.
- [NO VERIFICADO en zapier.com] Cuántas tareas incluye el Professional de entrada. n8n dice que son 750; en
  zapier.com depende del tramo que se elija en el selector.

**Lo que dice Make de sí misma** — https://www.make.com/en/pricing — consultado 2026-10-03
- Modelo por **créditos**: «Each module action in your scenario, like adding a Google Sheet row or fetching Gmail
  account data, counts as one credit.»
- El módulo de código consume «2 credits per 1 sec of code execution time».
- Planes, en USD, precio para 10k créditos/mes:
  - **Free**: $0, hasta 1,000 créditos/mes, 2 escenarios activos, intervalo mínimo de 15 minutos.
  - **Core**: $9/mes en anual o $10.59 en mensual.
  - **Pro**: $16 o $18.82.
  - **Teams**: $29 o $34.12.
  - **Enterprise**: «Custom pricing».
  - Descuento anual: «Save 15% or more».
- «3000+ apps». Transferencia de datos: «5 GB of data transfers per 10,000 monthly credits».

**Síntesis que se puede decir en el curso sin inventar nada:** n8n cobra por ejecución completa del flujo, Zapier por
tarea (cada acción que sale bien) y Make por crédito (cada acción de un módulo). Cada empresa lo explica así en su
propia página de precios.

## 8. Buenas prácticas que recomienda la documentación

- **Probar antes de publicar.**
  - Usa ejecuciones manuales (**Execute workflow** / **Execute step**) y fija datos (**Pin data**) para no llamar
    una y otra vez a los servicios externos.
  - Publica solo cuando funcione.
  - Fuentes: https://docs.n8n.io/build/understand-workflows/understand-executions/types-of-executions y
    https://docs.n8n.io/build/work-with-data/pin-and-mock-data — consultado 2026-10-03
- **Pensar en los errores desde el principio.** «it's a good practice to consider potential errors, and set up
  methods to handle them gracefully». La idea es tener un error workflow que avise. El changelog lo dice así:
  «Every production workflow should have one». — https://docs.n8n.io/build/flow-logic/handle-errors-gracefully y
  https://docs.n8n.io/changelog/readme — consultado 2026-10-03
- **Nombrar nodos y credenciales.**
  - Los nodos se renombran con **Rename node**.
  - Para las credenciales, la docs recomienda nombres que identifiquen «the app or service, type, and purpose» y
    seguir una convención de nombres.
  - Fuentes: https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes y
    https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials — consultado 2026-10-03
  - [NO VERIFICADO] No he encontrado en la docs actual una guía específica de cómo nombrar los nodos.
- **Documentar con notas.** Usa sticky notes y la opción **Notes** de cada nodo (con «Display note in flow»).
  n8n recomienda sticky notes en las plantillas para que otros entiendan el flujo. —
  https://docs.n8n.io/build/understand-workflows/workflow-components/add-notes-and-documentation y
  https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes — consultado 2026-10-03
- **Preparar los datos en un solo nodo.** Mejor usar **Edit Fields (Set)** para dejar los datos listos que repartir
  expresiones complejas por muchos nodos. —
  https://docs.n8n.io/build/work-with-data/transform-data/expressions-for-data-transformation — consultado 2026-10-03
- **Seguridad de las credenciales.**
  - Las credenciales son información privada: «be careful about sharing or revealing the credentials outside of
    n8n» (https://docs.n8n.io/build-your-first-workflow).
  - Usa OAuth siempre que sea posible.
  - Si varias personas usan la instancia, configura la gestión de usuarios
    (https://docs.n8n.io/privacy-and-security/what-you-can-do).
  - Limita los dominios con **Allowed HTTP Request Domains**
    (https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials).
  - n8n Assistant gestiona credenciales «without pasting secrets into chat»
    (https://docs.n8n.io/build/ways-of-building-workflows/n8n-assistant).
  - Consultado 2026-10-03
- **Revisar lo que genera la IA:** «Always review generated workflows before using them in production». —
  https://docs.n8n.io/build/ways-of-building-workflows/n8n-assistant — consultado 2026-10-03
- **En autoalojado:** HTTPS con proxy inverso, cifrado en reposo, auditoría de seguridad y precaución con los nodos
  de la comunidad. — https://docs.n8n.io/privacy-and-security/what-you-can-do — consultado 2026-10-03

## 9. Siguientes pasos: cursos oficiales y comunidad

- **n8n Academy** (cursos oficiales): https://learn.n8n.io/ — consultado 2026-10-03
  - Incluyen ejercicios prácticos, cuestionarios, examen final y certificado (aprobado con el 70 %). —
    https://docs.n8n.io/learning-paths — consultado 2026-10-03
  - Catálogo actual, 4 cursos en inglés: **QS101 n8n Quickstart**, **N8N101 Essentials: Your First Workflows**,
    **N8N102 Integrations: APIs & Connected Workflows**, **N8N103 In Practice: AI, Testing & Best Practices**. —
    https://learn.n8n.io/courses — consultado 2026-10-03
  - [NO VERIFICADO / ya no existen como tales] Los cursos **«Level one» y «Level two»** de la docs antigua. Sus URL
    (`https://docs.n8n.io/courses/level-one/`, `/level-two/`) redirigen a la portada de learn.n8n.io. En el curso,
    citar n8n Academy y sus cursos actuales.
- **Foro de la comunidad:** https://community.n8n.io/ (responde 200). «n8n provides free community support for all
  n8n users through the forum… both the n8n support team and community members can help.» —
  https://docs.n8n.io/contribute/where-to-get-help — consultado 2026-10-03
- **Documentación** como referencia: https://docs.n8n.io/ (glosario: https://docs.n8n.io/key-concept-glossary). —
  consultado 2026-10-03
- **Blog oficial:** https://blog.n8n.io/. La docs enlaza su introducción a los agentes de IA,
  https://blog.n8n.io/ai-agents/. [NO VERIFICADO: no abrí el artículo] — consultado 2026-10-03

---

## URLs para capturas (1920×1080, sin login)

Antes de capturar:
- **Cookies:** n8n.io muestra un aviso de cookies; elige «Decline all».
- **Privacidad:** difumina las caras, nombres y avatares de los testimonios (portada y páginas «vs») y el bloque
  «Created by» de las plantillas, que muestra el nombre y la foto del creador.
- **Plantillas:** el lienzo con el flujo tarda unos 8 segundos en cargar; espera antes de capturar.

| # | URL | Lección | Qué se ve |
|---|---|---|---|
| 1 | https://n8n.io/ | 1.1 Automatizar sin programar | Portada: lema «AI agents and workflows you can see and control» y botón «Get started for free» |
| 2 | https://n8n.io/vs/zapier/ | 1.2 n8n frente a Zapier y Make | Tabla comparativa hecha por n8n (alternativa: https://n8n.io/vs/make/) |
| 3 | https://n8n.io/pricing/ | 1.3 Cloud o autoalojado (y 1.2: precio por ejecución) | Tarjetas Starter / Pro / Business / Enterprise; el interruptor Monthly/Annually cambia los precios |
| 4 | https://docs.n8n.io/choose-how-to-use-n8n | 1.3 Cloud o autoalojado | Diagrama de decisión Cloud (Starter/Pro/Enterprise) frente a self-hosted (Community…Enterprise) y tabla de pros y contras |
| 5 | https://n8n.io/integrations/n8n-form-trigger/ | 2.1 Disparadores | Ficha del disparador de formulario con plantillas relacionadas (alternativa: https://n8n.io/integrations/gmail-trigger/) |
| 6 | https://n8n.io/integrations/ | 2.2 Nodos y acciones | Directorio con categorías, filtros Regular/Trigger/Core Nodes y contador de integraciones |
| 7 | https://docs.n8n.io/build/work-with-data/understand-n8ns-data-structure | 2.3 Datos entre pasos | Estructura de items en JSON y la vista de tabla de datos anidados (hay que bajar un poco) |
| 8 | https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials | 2.4 Credenciales | Pasos para crear una credencial y nota sobre cómo nombrarlas |
| 9 | https://n8n.io/workflows/11643-manage-contact-form-submissions-with-google-sheets-slack-alerts-and-gmail-replies/ | 3.1 Formulario→hoja→aviso | Lienzo de la plantilla: Form → Google Sheets → Slack / Gmail |
| 10 | https://docs.n8n.io/build/work-with-data/pin-and-mock-data | 3.2 Probar y corregir | Pin data y datos simulados, con iconos de la interfaz (complemento: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook para la Test URL y la Production URL) |
| 11 | https://docs.n8n.io/build/understand-workflows/save-and-publish-workflows | 3.3 Activar y ejecuciones | Botón **Publish** y sus estados. El texto va arriba; las capturas de la interfaz, más abajo |
| 12 | https://n8n.io/workflows/2122-automatically-email-great-leads-when-they-submit-a-form-and-record-in-hubspot/ | 4.1 Marketing: leads→CRM | Lienzo: Form → filtro → HubSpot → Gmail |
| 13 | https://n8n.io/workflows/2197-auto-label-incoming-gmail-messages-with-ai-nodes/ | 4.2 Clasificar correos | Lienzo: Gmail Trigger → LLM Chain + OpenAI → etiquetas |
| 14 | https://n8n.io/workflows/ | 4.4 Plantillas de la comunidad | Galería con contador de plantillas, categorías y filtros por app |

Extra para **4.3 IA y agentes** (puede sustituir a la #2 o la #6 si hacen falta 14 justas):
- https://n8n.io/workflows/1954-ai-agent-chat/ — plantilla oficial del n8n Team: AI Agent con Chat Model, Simple
  Memory y una herramienta.
- https://n8n.io/ai/ — página de IA de n8n (responde 200; no la he revisado visualmente).
- La página de la docs del AI Agent (https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent)
  **no tiene imágenes**: no sirve para captura.
