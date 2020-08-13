create or replace function autorizacao_rfid_webservice_academia(info json) returns character varying
    language plpgsql
as
$$
    /**
      Faz a identificação do usuário e valida as regras de acesso na academia
     */
DECLARE

    _equipamento      RECORD;
    _leitor           RECORD;
    _usuario          RECORD;
    _monitoramento    RECORD;
    _monitor          RECORD;
    _alunos           RECORD;
    _registropersonal INT;
    _autenticacao     VARCHAR;
    _situacaolocal    VARCHAR DEFAULT 'E';
    _autorizacao      VARCHAR DEFAULT 'Autorizado';
    _dscsituacao      VARCHAR DEFAULT 'Acesso autorizado';
    _situacaoleitor   VARCHAR DEFAULT 'Autorizado';
    _dispositivo      VARCHAR DEFAULT 'Cartão de proximidade';
    _situacaopersonal BOOLEAN;
    _situacaadolescente BOOLEAN;

BEGIN

    --Obtem informações da controladora-------------------------------------------------------------------------------------

    SELECT INTO _equipamento *
    FROM config.controladora
    WHERE num = (info ->> 'eq') :: INT;
    RAISE NOTICE 'Controladora: %',_equipamento.localizacao;

    --Obtem informações do leitor-------------------------------------------------------------------------------------------

    SELECT INTO _leitor *
    FROM config.controladora_leitores
    WHERE controladora = (info ->> 'eq')::INT
      AND porta = (info ->> 'li')::INT;
    RAISE NOTICE 'Leitor: %',_leitor.localizacao;

    --Obtem informações do usuário------------------------------------------------------------------------------------------

    _autenticacao := right(upper((info ->> 'rfid')), 5);
    RAISE NOTICE 'Autenticação: %', _autenticacao;

    SELECT INTO _usuario *
    FROM acesso.autorizacao_rfid_webservice_userinfo
    WHERE autenticacao = _autenticacao;
    RAISE NOTICE 'Usuário: %', _usuario.nome;

    --Obtem informações do monitor de acesso ao local-----------------------------------------------------------------------

    SELECT INTO _monitor *
    FROM acesso.monitor_pedestre
    WHERE autenticacao = _autenticacao
      AND equipamento = _equipamento.num;
    RAISE NOTICE 'Monitor do local(E=Entrada/S=Saida): %', _monitor.situacao;



    --Valida a entrada e a saída do usuário---------------------------------------------------------------------------------

    RAISE NOTICE 'Valida a entrada e a saída do usuário';
    RAISE NOTICE 'Autenticação encontrada no monitor:%',_monitor.autenticacao;

    IF (_usuario.tipo_de_cadastro = 'Personal')
    THEN

        -- Pesquisa a autorizacao do personal
        _situacaopersonal := acesso.alterna_status_personal(_autenticacao);

    ELSE

        RAISE NOTICE 'Pesquisa se o usuário está catastrado para algum personal';
        SELECT INTO _alunos personal
        FROM condominio.personal_atividades
        WHERE autenticacao = _autenticacao;

        RAISE NOTICE 'ID do personal: %', _alunos.personal;

        -- Atualiza a autorizacao do personal
        IF (_alunos.personal NOTNULL) THEN

            RAISE NOTICE 'Personal localizado, %', _alunos.personal;
            UPDATE acesso.monitor_personal
            SET situacao         = 'AUTORIZADO',
                data_solicitacao = current_timestamp
            WHERE personal = _alunos.personal;

        END IF;

    END IF;

    IF (_monitor.autenticacao IS NULL)
    THEN
        INSERT
        INTO acesso.monitor_pedestre (autenticacao, equipamento, localizacao_equipamento, leitor,
                                      localizacao_leitor, situacao, situacao_personal, data_solicitacao,
                                      registro_personal)
        VALUES (_autenticacao, _equipamento.num, _equipamento.localizacao, 0, 'Catraca', _situacaolocal,
                _situacaopersonal, current_timestamp, _registropersonal);
        RAISE NOTICE 'Cadastrando o RFID na localizacao';
    ELSE

        IF _monitor.situacao = 'E'
        THEN
            _situacaolocal := 'S';
        END IF;

        UPDATE acesso.monitor_pedestre
        SET situacao          = _situacaolocal
          , data              = current_timestamp
          , situacao_personal = _situacaopersonal
          , data_solicitacao  = current_timestamp
        WHERE autenticacao = _autenticacao
          AND equipamento = _equipamento.num
          AND leitor = 0;

        RAISE NOTICE 'O usuario encontra-se com status: %', _situacaolocal;
    END IF;

    SELECT
        INTO _monitoramento *
    FROM acesso.autorizacao_rfid_webservice_monitoramento
    WHERE autenticacao = _autenticacao;

    if (_monitoramento.autenticacao notnull) then

        RAISE NOTICE 'Registra o log de tentativa de passagem';
        INSERT INTO acesso.passagem_pedestre (condominio, bloco, andar, unidade, autenticacao, bloqueio,
                                              equipamento, localizacao_equipamento, leitor, localizacao_leitor,
                                              situacao_leitor, situacao_usuario,
                                              dsc_situacao, sentido, nome, tipo_de_cadastro, dispositivo)
        VALUES (_monitoramento.condominio, _monitoramento.bloco, _monitoramento.andar, _monitoramento.unidade, _autenticacao, _monitoramento.bloqueio,
                _equipamento.num, _equipamento.localizacao, _leitor.num, _leitor.localizacao, _situacaoleitor, 'Autorizado',
                'Monitoramento', _leitor.sentido, _monitoramento.nome, 'Monitoramento', _dispositivo);

        IF _monitor.situacao = 'E' THEN
            _situacaolocal := 'S';
        END IF;

        RAISE NOTICE '#### SAIDA DO PROCEDIMENTO: O USUÁRIO É DO MONITORAMENTO E ESTÁ LIBERADO ####';
        RETURN '{' || _monitoramento.nome || '|' || _situacaolocal || '}';

    end if;



    --Valida o bloqueio operacional do usuário------------------------------------------------------------------------------
    IF _situacaopersonal = FALSE THEN -- Utilizado para validar o uso do chaveiro pelo personal

        _autorizacao = 'Não autorizado';
        _dscsituacao = 'O personal deve aguardar a passagem do chaveiro do morador';
        _situacaolocal = 'A';
        _situacaoleitor = 'Não autorizado';
        RAISE NOTICE '#### SAIDA DO PROCEDIMENTO: CHAVEIRO DO PERSONAL. ELE DEVE AGUARDAR A PASSAGEM DO CHAVEIRO DO MORADOR ####';
        RETURN NULL;

    END IF;

    IF acesso.verifica_agendamento_usuario(_autenticacao, _equipamento.num) = FALSE THEN

        _autorizacao = 'Não autorizado';
        _dscsituacao = 'Nenhum agendamento está confirmado para este registro';
        _situacaolocal = 'A';
        _situacaoleitor = 'Não autorizado';
        RAISE NOTICE '#### SAIDA DO PROCEDIMENTO: O HORÁRIO DE RESERVA AINDA NÃO ESTÁ DISPONÍVEL ####';
        RETURN NULL;

    END IF;

    RAISE NOTICE 'Valida o bloqueio operacional do usuário';
    IF _usuario.bloqueio NOTNULL AND _usuario.bloqueio > 0 THEN
        _autorizacao = 'Não autorizado';
        _dscsituacao = 'Existe um bloqueio operacional para o usuário';
        RAISE NOTICE 'Existe um bloqueio operacional para o usuário %', _usuario.bloqueio;
    ELSE
        RAISE NOTICE 'Nenhum bloqueio operacional para o usuário';
    END IF;

    --Valida a idade do usuário com a idade permitida no leitor-------------------------------------------------------------

    RAISE NOTICE 'Valida a idade do usuário com a idade permitida no leitor';
    RAISE NOTICE 'A idade mínima para o leitor é % e o usuário possui % anos', _leitor.idade_minima, _usuario.idade;

    IF (_usuario.nome NOTNULL) AND (_usuario.idade < 12) THEN

        _autorizacao = 'Não autorizado';
        _dscsituacao = 'Idade não permitida';
        _situacaolocal = 'I';
        RAISE NOTICE '#### SAIDA DO PROCEDIMENTO: A IDADE NÃO É PERMITIDA ####';
        RETURN NULL;

    ELSEIF (_usuario.nome NOTNULL) AND (_usuario.idade between 12 and 16) THEN

        RAISE NOTICE 'NECESSÁRIO ACOMPANHANTE';
        _situacaadolescente := acesso.alterna_status_adolescente(_autenticacao);
        RAISE NOTICE 'SITUACAO DO CHAVEIRO %', _situacaadolescente;

        IF (_situacaadolescente = FALSE) THEN
            _autorizacao = 'Não autorizado';
            _dscsituacao = 'O chaveiro do acompanhante ainda não autorizou';
            _situacaolocal = 'I';
            RAISE NOTICE '#### SAIDA DO PROCEDIMENTO: O CHAVEIRO DO ACOMPANHANTE AINDA NÃO AUTORIZOU A PASSAGEM ####';
            RETURN NULL;
        end if;

    ELSEIF (_usuario.nome NOTNULL) THEN

        UPDATE acesso.monitor_adolescente
        SET situacao         = 'AUTORIZADO',
            data_solicitacao = current_timestamp
        WHERE unidade = _usuario.unidade_id;

    ELSEIF _usuario.nome ISNULL THEN

        _autorizacao = 'Não autorizado';
        _dscsituacao = 'Não foi localizado';
        _situacaolocal = 'N';
        _situacaoleitor = 'Não autorizado';
        RAISE NOTICE 'O usuário não foi localizado';

    ELSEIF _usuario.ativacao > current_timestamp THEN

        _autorizacao = 'Não autorizado';
        _dscsituacao = 'Cadastro não ativado';
        _situacaolocal = 'A';
        _situacaoleitor = 'Não autorizado';
        RAISE NOTICE 'O usuário não está ativado';

    ELSE
        RAISE NOTICE 'A idade do usuário é permitida para o local';
    END IF;

    --Registra o log de tentativa de passagem-------------------------------------------------------------------------------

    RAISE NOTICE 'Registra o log de tentativa de passagem';
    INSERT INTO acesso.passagem_pedestre (condominio, bloco, andar, unidade, autenticacao, bloqueio,
                                          equipamento, localizacao_equipamento, leitor, localizacao_leitor,
                                          situacao_leitor, situacao_usuario,
                                          dsc_situacao, sentido, nome, tipo_de_cadastro, dispositivo)
    VALUES (_usuario.condominio, _usuario.bloco, _usuario.andar, _usuario.unidade, _autenticacao, _usuario.bloqueio,
            _equipamento.num, _equipamento.localizacao, _leitor.num, _leitor.localizacao, _situacaoleitor, _autorizacao,
            _dscsituacao, _leitor.sentido, _usuario.nome, _usuario.tipo_de_cadastro, _dispositivo);

    --Define a saída da validação-------------------------------------------------------------------------------------------

    RAISE NOTICE '#### SAIDA DO PROCEDIMENTO: FINAL DA VALIDAÇÃO O USUÁRIO ESTÁ % E O SENTIDO DA PASSAGEM É (%) ####', _autorizacao, _situacaolocal;
    RETURN '{' || _usuario.nome || '|' || _situacaolocal || '}';

END

$$;

alter function autorizacao_rfid_webservice_academia_excluir(json) owner to postgres;

select autorizacao_rfid_webservice_academia_excluir('{"eq":"2488","li":"0","rfid":"8E9B3"}');
select autorizacao_rfid_webservice_academia_excluir('{"eq":"2488","li":"0","rfid":"8D7DD"}');

select nome, autenticacao from condominio.moradores
                                   join condominio.unidades on moradores.condominio = unidades.condominio and moradores.bloco = unidades.bloco and moradores.andar = unidades.andar and moradores.unidade = unidades.num
where unidades.bloco = 7 and unidades.unidade = 33