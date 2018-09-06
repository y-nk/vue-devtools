let id = 0;

export default class DocumentSelector {
  constructor (bridge) {
    this.bridge = bridge

    this.rootDocument = document
    this.rootDocument.__VUE_DEVTOOLS_DOCUMENT_ID__ = 0;

    this.availableDocuments = [this.rootDocument]
    this.currentDocument = this.availableDocuments[0]
  }

  getCurrentDocument () {
    return this.currentDocument
  }

  setCurrentDocument (document) {
    this.currentDocument = document
  }

  setCurrentDocumentById (id) {
    const proposedDocument = this.availableDocuments.find(document => document.__VUE_DEVTOOLS_DOCUMENT_ID__ === id)

    if (proposedDocument !== null) {
      this.setCurrentDocument(proposedDocument)
    }
  }

  scanForDocuments () {
    const iframes = Array.from(this.currentDocument.getElementsByTagName('iframe'))

    const newDocuments = iframes
      .map(iframe => iframe.contentDocument)
      .filter(document => document.defaultView.hasOwnProperty('VUE_DEVTOOLS_CONFIG'))
      .filter(document => this.availableDocuments.indexOf(document) === -1);

    newDocuments.forEach(document => {
      document.__VUE_DEVTOOLS_DOCUMENT_ID__ = ++id
    })

    this.availableDocuments = this.availableDocuments.concat(newDocuments)

    const transportableWrappers = this.availableDocuments.map(document => {
      return {
        id : document.__VUE_DEVTOOLS_DOCUMENT_ID__,
        url: document.location.href
      }
    })

    this.bridge.send('documents:update', transportableWrappers)
  }
}
