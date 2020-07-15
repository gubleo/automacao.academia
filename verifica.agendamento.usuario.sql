create or replace function acesso.verifica_agendamento_usuario(_autenticacao character varying, _equipamento integer) returns boolean
    language plpgsql
as
$$
declare
begin

    /**
      Verifica se existe um agendamento para o usuário no espaço informado
     */

    if (
           SELECT count(*)
           FROM acesso.reserva
           WHERE upper(autenticacao) = upper(_autenticacao)
             and equipamento = _equipamento
             and inicio::date = current_date
             and (current_timestamp between inicio and final + interval '5' minute) = true
       ) = 0 THEN
        return false;
    end if;

    return true;
end
$$;