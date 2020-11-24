#!/usr/bin/env bash
set +x -e

function debug_log() {
    if [ -n "$DEBUG" ] && [ "$DEBUG" != "false" ]; then
        MSG="${*}"
        echo "::debug file=${BASH_SOURCE[0]}:: ${MSG}"
    fi
}
function command_exists() {
    command -v "$1" >/dev/null 2>&1
}
function installer() {
    if command -v yum >/dev/null 2>&1; then
        yum "$@"
    elif command -v apt-get >/dev/null 2>&1; then
        apt-get "$@"
    elif command -v brew >/dev/null 2>&1; then
        brew "$@"
    else
        debug_log "Can't install: " "$@"
        exit 1
    fi
}
function install_app() {
    # Usage: install_app <app name> [second app] [third app]
    # Is App installed?
    INSTALL_LIST=()
    for cmd in $@; do
        if ! command -v "${cmd}" >/dev/null 2>&1; then
            debug_log "Installing ${cmd}"
            INSTALL_LIST+=("${cmd}")
        else
            debug_log "${cmd} installed already"
        fi
    done
    if [ ${#INSTALL_LIST[@]} -gt 0 ]; then
        if [ "$(uname)" == "Darwin" ]; then
            installer install "${INSTALL_LIST[@]}"
        elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
            installer install -y -q "${INSTALL_LIST[@]}"
        fi
    fi
}

if [ "$(uname)" == "Darwin" ]; then
    install_app jq
    if ! command_exists yq; then
        install_app python-yq
    fi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    install_app jq
    pip3 install yq
fi
