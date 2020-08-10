class Historico extends EndPoint {

    constructor(params) {
        super();

        this.listar = '/condominio/gymaccess?unidade=eq.';

        this.AbrirRecurso('html/historico.html').then(value => {
            params.page.innerHTML = value.toString();
            this.Listar(params.unidade.num).then(value => {
                this.MontaGrid(value);
            });
        });
    }

    MontaGrid(historico) {

        let template = document.getElementById('tplhistorico');
        let gridhistorico = document.getElementById('gridhistorico');

        historico.filter(function (item) {
            let linha = template.content.cloneNode(true);
            linha.getElementById('data').innerText = item.data;
            linha.getElementById('nome').innerText = item.nome;
            gridhistorico.appendChild(linha);
        }.bind(this));

        window.dispatchEvent(new CustomEvent('AoCaregarHistorico', {}));
    }
}